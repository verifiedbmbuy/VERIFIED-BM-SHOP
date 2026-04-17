import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SEOFixRequest {
  action: string; // "fix_meta_description" | "fix_meta_title" | "fix_slug" | "suggest_titles" | "fix_alt_text" | "fix_image_details" | "suggest_headings" | "fix_content_intro" | "bulk_media_fix"
  context: {
    focusKeyword?: string;
    currentTitle?: string;
    currentDescription?: string;
    currentSlug?: string;
    currentContent?: string;
    productTitle?: string;
    fileName?: string;
    currentAltText?: string;
    urlPrefix?: string;
    images?: Array<{ id: string; fileName: string; altText: string; urlSlug: string }>;
  };
}

const SYSTEM_PROMPT = `You are an expert SEO specialist for "Verified BM Shop" (verifiedbm.shop), a company selling verified Facebook Business Managers, WhatsApp Business API accounts, and digital advertising products. 

Brand rules:
- Always use "Verified BM Shop" (plural, lowercase 's')
- Target audience: digital advertisers, agencies, media buyers
- Tone: professional, trustworthy, action-oriented
- Use power words: Best, Top, Proven, Ultimate, Verified, Instant, Guaranteed, Premium, Trusted, Professional
- Include numbers when relevant (e.g., "5 Best...", "2026 Guide")
- Keep positive sentiment

You must respond ONLY with valid JSON. No markdown, no code fences, no explanations outside the JSON.`;

function buildPrompt(req: SEOFixRequest): string {
  const { action, context } = req;
  const kw = context.focusKeyword || "";

  switch (action) {
    case "fix_meta_description":
      return `Write an SEO-optimized meta description for a page about "${context.productTitle || kw}".
Focus keyword: "${kw}"
Current title: "${context.currentTitle || ""}"
Current content excerpt: "${(context.currentContent || "").substring(0, 500)}"

Requirements:
- Between 120-155 characters
- Include the focus keyword naturally near the beginning
- Include a call-to-action
- Positive sentiment
- Mention "Verified BM Shop" if relevant

Respond with: {"metaDescription": "your description here"}`;

    case "fix_meta_title":
      return `Write an SEO-optimized title tag for "${context.productTitle || kw}".
Focus keyword: "${kw}"
Current description: "${context.currentDescription || ""}"

Requirements:
- Under 60 characters total
- Start with or include the focus keyword
- Include a power word (Best, Top, Proven, Ultimate, etc.)
- Include a number if possible
- Positive sentiment

Respond with: {"metaTitle": "your title here"}`;

    case "suggest_titles":
      return `Generate 3 SEO-optimized title alternatives for "${context.productTitle || kw}".
Focus keyword: "${kw}"
Current title: "${context.currentTitle || ""}"

Each title must:
- Be under 60 characters
- Include the focus keyword
- Have at least one power word
- Include a number
- Have positive sentiment

Respond with: {"titles": ["title 1", "title 2", "title 3"]}`;

    case "fix_slug":
      return `Generate an SEO-friendly URL slug for: "${context.productTitle || kw}".
Focus keyword: "${kw}"
URL prefix: "${context.urlPrefix || "/product/"}"

Requirements:
- Include the focus keyword
- Lowercase, hyphen-separated
- Under 50 characters (slug only, no domain)
- No stop words (the, a, an, is, etc.)

Respond with: {"slug": "your-slug-here"}`;

    case "suggest_headings":
      return `Suggest 3 H2 subheadings that include the focus keyword "${kw}" for a page about "${context.productTitle || kw}".
Current content: "${(context.currentContent || "").substring(0, 800)}"

Each heading must naturally include "${kw}" and be relevant to the content.

Respond with: {"headings": ["heading 1", "heading 2", "heading 3"]}`;

    case "fix_alt_text":
      return `Write SEO-optimized image alt text based on the file name.
File name: "${context.fileName || ""}"
Focus keyword: "${kw || context.productTitle || ""}"

Requirements:
- Descriptive, 5-15 words
- Include the focus keyword naturally
- Describe what the image likely shows based on the filename
- Proper capitalization

Respond with: {"altText": "your alt text here"}`;

    case "fix_image_details":
      return `Write detailed image metadata/description for Schema.org indexing.
File name: "${context.fileName || ""}"
Alt text: "${context.currentAltText || ""}"
Focus keyword: "${kw || ""}"

Requirements:
- 1-3 sentences, technically descriptive
- Include specifications relevant to digital advertising products
- Mention "Verified BM Shop" brand naturally
- Useful for search engine image indexing

Respond with: {"imageDetails": "your detailed description here"}`;

    case "fix_content_intro":
      return `Rewrite the first paragraph of content to include the focus keyword "${kw}" naturally in the first 10%.
Current content start: "${(context.currentContent || "").substring(0, 300)}"
Page title: "${context.productTitle || ""}"

Requirements:
- Keep the same meaning and tone
- Naturally include "${kw}" in the first 1-2 sentences
- Professional tone for digital advertising audience

Respond with: {"introText": "your rewritten intro paragraph here"}`;

    case "bulk_media_fix":
      return `Fix SEO metadata for these media files. For each, generate: proper alt text (5-15 words, descriptive), a branded URL slug (lowercase, hyphenated, ending in .webp), and proper capitalized file name.

Files to fix:
${(context.images || []).map((img, i) => `${i + 1}. fileName: "${img.fileName}", currentAlt: "${img.altText}", currentSlug: "${img.urlSlug}"`).join("\n")}

Respond with: {"fixes": [{"id": "file_id", "altText": "...", "urlSlug": "slug.webp", "fileName": "proper name"}]}
Use the exact IDs from the input.`;

    default:
      return `Analyze and fix the SEO issue. Focus keyword: "${kw}". Respond with appropriate JSON.`;
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
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
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
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const body: SEOFixRequest = await req.json();
    const prompt = buildPrompt(body);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
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
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }), {
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

    // Parse JSON from response, handling potential markdown fences
    let parsed;
    try {
      const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      parsed = { error: "Failed to parse AI response", raw: content };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("seo-ai-fix error:", e);
    const errorMessage = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
