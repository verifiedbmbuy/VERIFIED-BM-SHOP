import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SITE_URL = "https://verifiedbm.shop";

function buildSystemPrompt(products: any[]) {
  const productLines = products.map((p) => {
    const price = p.sale_price
      ? `$${p.sale_price} (was $${p.price})`
      : `$${p.price}`;
    const link = `${SITE_URL}/shop/${p.slug}`;
    return `- **${p.title}** — ${price} | ${p.short_description || p.category} | [Buy ${p.title} here](${link})`;
  });

  return `You are the Verified BM Shop AI Assistant — a friendly, professional customer support agent for Verified BM Shop.

## About Verified BM Shop
Verified BM Shop specializes in selling Verified Facebook Business Managers (BMs) and WhatsApp Business API solutions. We help businesses run Facebook & Instagram ads safely without getting banned.

## Products We Sell (with direct buy links)
${productLines.join("\n")}

## Key Selling Points
- All BMs are fully verified and ready to use immediately
- 24/7 customer support via WhatsApp and Telegram
- Replacement guarantee if any issues arise
- Secure payment options including crypto

## Your Behavior
- Be concise, helpful, and professional
- When a customer asks about a specific product, ALWAYS include the direct buy link in Markdown format like: [Buy Product Name here](link)
- If they ask about pricing, include the product link alongside the price
- Recommend products based on the customer's needs
- For payment or order issues, suggest contacting support via WhatsApp: https://wa.me/8801302669333 or Telegram: https://t.me/Verifiedbmbuy
- Never make up information about products or pricing
- Keep responses short (2-4 sentences unless more detail is needed)
- Use a warm, conversational tone
- Browse all products: [Visit our Shop](${SITE_URL}/shop)`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      const fallback =
        'data: {"choices":[{"delta":{"content":"AI chat is temporarily unavailable right now. Please contact support on WhatsApp: https://wa.me/8801302669333 or Telegram: https://t.me/Verifiedbmbuy"}}]}\n\n' +
        "data: [DONE]\n\n";
      return new Response(fallback, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // Fetch products from DB
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const { data: products } = await sb
      .from("products")
      .select("title, slug, price, sale_price, short_description, category")
      .eq("stock_status", "in_stock")
      .order("sort_order");

    const systemPrompt = buildSystemPrompt(products || []);

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("vbb-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
