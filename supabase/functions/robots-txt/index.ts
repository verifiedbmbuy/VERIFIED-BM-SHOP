import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_ROBOTS = `# =============================================
# robots.txt — Verified BM Shop
# =============================================

User-agent: Googlebot
Allow: /
Disallow: /admin/
Disallow: /checkout
Disallow: /admin/login

User-agent: Bingbot
Allow: /
Disallow: /admin/
Disallow: /checkout

User-agent: SemrushBot
Allow: /

User-agent: SiteAuditBot
Allow: /

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: *
Allow: /
Disallow: /admin/
Disallow: /checkout

# Sitemap
Sitemap: https://verifiedbm.shop/sitemap.xml`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "robots_txt")
    .single();

  const content = data?.value || DEFAULT_ROBOTS;

  return new Response(content, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
