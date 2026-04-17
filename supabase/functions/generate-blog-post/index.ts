import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function base64ToUint8Array(base64: string): Uint8Array {
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

async function generateAndUploadImage(
  apiKey: string,
  prompt: string,
  fileName: string,
  sb: any
): Promise<string | null> {
  try {
    console.log(`Generating image: ${fileName}`);
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      console.error(`Image generation failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageData) {
      console.error("No image data in response");
      return null;
    }

    // Extract base64 data
    const base64Match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      console.error("Invalid base64 image format");
      return null;
    }

    const ext = base64Match[1] === "jpeg" ? "jpg" : base64Match[1];
    const base64Content = base64Match[2];
    const imageBytes = base64ToUint8Array(base64Content);
    const filePath = `blog/${fileName}.${ext}`;
    const mimeType = `image/${base64Match[1]}`;

    // Upload to media bucket
    const { error: uploadError } = await sb.storage
      .from("media")
      .upload(filePath, imageBytes, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const { data: urlData } = sb.storage.from("media").getPublicUrl(filePath);
    const publicUrl = urlData?.publicUrl;

    // Save to media_files table
    await sb.from("media_files").insert({
      file_name: fileName,
      file_path: filePath,
      url: publicUrl,
      mime_type: mimeType,
      file_size: imageBytes.length,
      alt_text: prompt.substring(0, 120),
      url_slug: `${fileName}.webp`,
    });

    console.log(`Image uploaded: ${publicUrl}`);
    return publicUrl;
  } catch (err) {
    console.error("Image generation error:", err);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check — admin only
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: roleData } = await supabaseClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { topic, focusKeyword, category, tone, generateImages } = await req.json();

    if (!topic || !focusKeyword) {
      return new Response(JSON.stringify({ error: "Topic and focus keyword are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch products for Related Products section
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: products } = await sb
      .from("products")
      .select("title, slug, price, sale_price, short_description, category, image_url")
      .eq("stock_status", "in_stock")
      .order("sort_order")
      .limit(6);

    const productListings = (products || []).map(
      (p: any) => `- ${p.title} ($${p.sale_price || p.price}) — ${p.short_description || p.category} — URL: /shop/${p.slug}`
    ).join("\n");

    const systemPrompt = `You are an expert blog writer and SEO specialist for "Verified BM Shop" (verifiedbm.shop). You write professional, human-like blog posts that rank on Google.

## STRICT WRITING RULES (Human-Centric)
- Use a natural, conversational tone. Write like a knowledgeable friend explaining things.
- Use common, everyday words. NEVER use jargon, corporate fluff, or AI-sounding phrases.
- Keep sentences SHORT and punchy — maximum 15-20 words each.
- Use active voice. Avoid passive voice entirely.
- Use transition words (However, Moreover, In fact, Here's the thing, That said) to flow naturally.
- Vary sentence length. Mix short punchy sentences with slightly longer ones.
- Use "you" and "your" to address the reader directly.
- NEVER use these AI clichés: "In today's digital landscape", "It's important to note", "In conclusion", "Furthermore", "Delve into", "Navigating the", "Robust", "Leverage", "Streamline", "Holistic approach".

## SEO ARCHITECTURE (MANDATORY)
- The H1 title MUST contain the focus keyword.
- The FIRST paragraph MUST contain the focus keyword within the first 2 sentences.
- At least ONE H2 subheading MUST contain the focus keyword.
- Keyword density: 1.0-1.5% throughout the content.
- Internal links to products where relevant.

## REQUIRED STRUCTURE
The blog post MUST follow this exact structure:

1. **Key Takeaway Box** — A highlighted summary box (3-4 bullet points) at the very top
2. **Table of Contents** — Linked list of all H2 sections
3. **Introduction** — Hook the reader, state the problem, preview the solution (include focus keyword)
4. **Main Body** — 3-5 H2 sections with clear bullet points and actionable advice
5. **FAQ Section** — CRITICAL: Generate 3-5 FAQs following these STRICT rules:
   a. Questions MUST mirror real "People Also Ask" queries on Google for this topic. Think about what a buyer/advertiser would actually search.
   b. Each answer MUST be exactly 40-60 words — this is the Featured Snippet sweet spot.
   c. The FIRST sentence of every answer MUST directly answer the question with zero fluff or preamble. No "Great question!" or "Well,".
   d. In at least ONE answer, naturally include an internal link: <a href="https://verifiedbm.shop/shop">verified Business Manager</a> or link to a specific product.
   e. Use <h3> for questions and <p> for answers.
6. **Related Products** — Widget linking to relevant Verified BM products

## FAQ JSON-LD OUTPUT (MANDATORY)
In addition to the HTML FAQ section, you MUST also output a separate "faqs" array in the JSON response with this structure:
"faqs": [
  { "question": "...", "answer": "..." },
  ...
]
This array will be used to generate FAQPage Schema markup for Google indexing.

## AVAILABLE PRODUCTS FOR INTERNAL LINKING
${productListings}

## OUTPUT FORMAT
Respond ONLY with valid JSON (no markdown fences). The JSON must have these exact fields:
{
  "title": "SEO-optimized H1 title with a power word + number (under 60 chars)",
  "slug": "seo-friendly-url-slug",
  "content": "Full HTML content of the blog post (including the HTML FAQ section with faq-item divs)",
  "excerpt": "2-3 sentence summary for previews",
  "metaTitle": "SEO title under 60 chars with power word + number",
  "metaDescription": "Meta description under 155 chars with CTA",
  "readTime": "X min read",
  "featuredImageSlug": "branded-image-slug",
  "faqs": [{"question": "...", "answer": "..."}]
}`;

    const userPrompt = `Write a complete blog post about: "${topic}"

Focus Keyword: "${focusKeyword}"
Category: "${category || "Verified BM"}"
Tone: "${tone || "Professional and conversational"}"

Remember:
- Title MUST have a power word AND a number (e.g., "7 Proven Ways to..." or "5 Best...")
- Focus keyword "${focusKeyword}" MUST appear in: H1, first paragraph, at least one H2
- Meta description MUST be under 155 chars with a clear call-to-action
- Include the Key Takeaway box, Table of Contents, FAQ section, and Related Products widget
- Content should be 800-1200 words
- Featured image slug format: ${focusKeyword.toLowerCase().replace(/\s+/g, "-")}-guide.webp
- Related Products widget should link to: https://verifiedbm.shop/shop/[product-slug]

For the Related Products section, use this HTML format:
<div class="related-products">
<h2>Related Products from Verified BM Shop</h2>
<div class="product-grid">
[Include 2-3 most relevant products from the available list with links]
</div>
</div>

For the FAQ section, format each Q&A as:
<div class="faq-item">
<h3>Question here? (mirror a real Google "People Also Ask" query)</h3>
<p>Answer here — MUST be 40-60 words. First sentence directly answers the question. In at least one FAQ, include an internal link like <a href="https://verifiedbm.shop/shop">verified Business Manager</a>.</p>
</div>

IMPORTANT: Also include a separate "faqs" array in the JSON output with the same questions and answers as plain text (no HTML in the faqs array answers, except <a> links). This is used for Schema markup.

For the Key Takeaway box:
<div class="key-takeaway">
<h3>🔑 Key Takeaway</h3>
<ul>
<li>Point 1</li>
<li>Point 2</li>
<li>Point 3</li>
</ul>
</div>`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";

    let parsed;
    try {
      const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      parsed = JSON.parse(cleaned);
      // Strip any "blog/" prefix from slug to prevent double /blog/blog/ paths
      if (parsed.slug && parsed.slug.startsWith("blog/")) {
        parsed.slug = parsed.slug.replace(/^blog\//, "");
      }
    } catch {
      console.error("Failed to parse AI response:", content);
      parsed = { error: "Failed to parse AI response", raw: content };
    }

    // Generate images if requested
    if (generateImages && parsed.title && !parsed.error) {
      const slug = parsed.slug || focusKeyword.toLowerCase().replace(/\s+/g, "-");
      const thumbnailFileName = `${slug}-thumbnail`;
      const bodyFileName = `${slug}-body`;

      const thumbnailPrompt = `Create a professional, modern blog featured image for an article titled "${parsed.title}". Topic: ${topic}. Style: clean, corporate, digital marketing theme with blue and white tones. Include subtle tech/business imagery. Eye-catching for social media sharing. IMPORTANT: The image must be exactly 1200x630 pixels (1.91:1 aspect ratio), optimized for Open Graph / social sharing and blog hero banners. Ultra high resolution.`;

      const bodyPrompt = `Create a professional illustration for a blog article about ${topic}. Visually represent the concept of ${focusKeyword}. Style: modern, informative infographic style with icons and clean design. Professional blue, teal and white color scheme. IMPORTANT: The image must be exactly 1200x675 pixels (16:9 aspect ratio), optimized for inline blog content at full-width within an article body. Ultra high resolution.`;

      // Generate both images in parallel
      const [thumbnailUrl, bodyImageUrl] = await Promise.all([
        generateAndUploadImage(LOVABLE_API_KEY, thumbnailPrompt, thumbnailFileName, sb),
        generateAndUploadImage(LOVABLE_API_KEY, bodyPrompt, bodyFileName, sb),
      ]);

      parsed.featuredImageUrl = thumbnailUrl;
      parsed.bodyImageUrl = bodyImageUrl;

      // Insert body image into content after the first H2 section
      if (bodyImageUrl && parsed.content) {
        const bodyImgHtml = `<figure class="blog-body-image" style="margin: 2rem 0;"><img src="${bodyImageUrl}" alt="${parsed.title} - ${focusKeyword}" style="width:100%;border-radius:12px;" /><figcaption style="text-align:center;font-size:0.85rem;color:#666;margin-top:0.5rem;">${parsed.title}</figcaption></figure>`;
        // Insert after first </h2>...</p> block
        const firstH2End = parsed.content.indexOf("</p>", parsed.content.indexOf("<h2"));
        if (firstH2End !== -1) {
          const insertPos = firstH2End + 4;
          parsed.content = parsed.content.slice(0, insertPos) + bodyImgHtml + parsed.content.slice(insertPos);
        } else {
          // Fallback: insert after intro
          const introEnd = parsed.content.indexOf("</p>", parsed.content.indexOf("<p"));
          if (introEnd !== -1) {
            const insertPos = introEnd + 4;
            parsed.content = parsed.content.slice(0, insertPos) + bodyImgHtml + parsed.content.slice(insertPos);
          }
        }
      }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-blog-post error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
