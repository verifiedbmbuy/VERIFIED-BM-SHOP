import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.208.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    // Allow anon key callers (guest checkout)
    const isAnonKey = token === supabaseAnonKey;
    if (!isAnonKey) {
      const { data: { user }, error: userError } = await authSupabase.auth.getUser(token);
      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get Cryptomus settings from site_settings
    const { data: apiKeyRow } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "cryptomus_api_key")
      .single();

    const { data: merchantIdRow } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "cryptomus_merchant_id")
      .single();

    const apiKey = apiKeyRow?.value;
    const merchantId = merchantIdRow?.value;

    if (!apiKey || !merchantId) {
      return new Response(
        JSON.stringify({ error: "Cryptomus is not configured. Please set API key and Merchant ID in Admin Settings." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { order_id, amount, currency } = await req.json();

    if (!order_id || !amount) {
      return new Response(
        JSON.stringify({ error: "Missing order_id or amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate order exists
    const { data: orderCheck } = await supabase
      .from("orders")
      .select("id")
      .eq("id", order_id)
      .single();

    if (!orderCheck) {
      return new Response(
        JSON.stringify({ error: "Invalid order" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const webhookUrl = `${supabaseUrl}/functions/v1/cryptomus-webhook`;

    const body = JSON.stringify({
      amount: String(amount),
      currency: currency || "USD",
      order_id: order_id,
      url_callback: webhookUrl,
      is_payment_multiple: false,
      lifetime: 3600,
    });

    // Cryptomus requires sign = md5(base64(body) + apiKey)
    const bodyBase64 = base64Encode(new TextEncoder().encode(body));
    const signData = new TextEncoder().encode(bodyBase64 + apiKey);
    const hashBuffer = await crypto.subtle.digest("MD5", signData);
    const sign = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const response = await fetch("https://api.cryptomus.com/v1/payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        merchant: merchantId,
        sign: sign,
      },
      body: body,
    });

    const result = await response.json();

    if (result?.result?.url) {
      // Save the invoice ID to the order
      await supabase
        .from("orders")
        .update({ cryptomus_invoice_id: result.result.uuid })
        .eq("id", order_id);

      return new Response(
        JSON.stringify({ url: result.result.url, invoice_id: result.result.uuid }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: result?.message || "Failed to create invoice" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Cryptomus invoice error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
