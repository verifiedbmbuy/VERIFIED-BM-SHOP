import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=3600",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Read site URL
  const { data: siteUrlRow } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "site_url")
    .single();
  const siteUrl = (siteUrlRow?.value || Deno.env.get("SITE_URL") || "https://verifiedbm.shop").replace(/\/$/, "");
  const today = new Date().toISOString().split("T")[0];

  // Load sitemap settings
  const { data: settings } = await supabase
    .from("site_settings")
    .select("key, value")
    .like("key", "sitemap_%");

  const s: Record<string, string> = {};
  if (settings) for (const r of settings) s[r.key] = r.value;

  const blogPriority = s["sitemap_blog_priority"] || "0.6";
  const defaultChangefreq = s["sitemap_default_changefreq"] || "weekly";

  // Fetch published posts, products, pages, and media in parallel
  const [postsRes, productsRes, pagesRes, mediaRes] = await Promise.all([
    supabase
      .from("blog_posts")
      .select("slug, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false }),
    supabase
      .from("products")
      .select("slug, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("pages")
      .select("slug, updated_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false }),
    supabase
      .from("media_files")
      .select("url_slug, created_at")
      .not("url_slug", "is", null)
      .order("created_at", { ascending: false }),
  ]);

  const posts = postsRes.data || [];
  const products = productsRes.data || [];
  const pages = pagesRes.data || [];
  const mediaFiles = mediaRes.data || [];

  // Static pages (including new policy/legal pages)
  const staticPages = [
    { loc: "/", priority: s["sitemap_priority_home"] || "1.0", changefreq: "daily", lastmod: today },
    { loc: "/shop", priority: s["sitemap_priority_shop"] || "0.9", changefreq: "daily", lastmod: today },
    { loc: "/blog", priority: s["sitemap_priority_blog"] || "0.8", changefreq: "daily", lastmod: today },
    { loc: "/contact", priority: s["sitemap_priority_contact"] || "0.7", changefreq: "monthly", lastmod: today },
    { loc: "/about", priority: s["sitemap_priority_about"] || "0.7", changefreq: "monthly", lastmod: today },
    { loc: "/faq", priority: "0.6", changefreq: "weekly", lastmod: today },
    { loc: "/terms", priority: "0.4", changefreq: "monthly", lastmod: today },
    { loc: "/privacy", priority: "0.4", changefreq: "monthly", lastmod: today },
    { loc: "/refund-policy", priority: "0.4", changefreq: "monthly", lastmod: today },
    { loc: "/replacement-guarantee", priority: "0.5", changefreq: "monthly", lastmod: today },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">`;

  const hreflang = (url: string) => `
    <xhtml:link rel="alternate" hreflang="en" href="${url}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${url}" />`;

  for (const page of staticPages) {
    const fullUrl = `${siteUrl}${page.loc}`;
    xml += `
  <url>
    <loc>${fullUrl}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>${hreflang(fullUrl)}
  </url>`;
  }

  for (const post of posts) {
    const postUrl = `${siteUrl}/blog/${post.slug}`;
    xml += `
  <url>
    <loc>${postUrl}</loc>
    <lastmod>${new Date(post.published_at).toISOString().split("T")[0]}</lastmod>
    <changefreq>${defaultChangefreq}</changefreq>
    <priority>${blogPriority}</priority>${hreflang(postUrl)}
  </url>`;
  }

  const productPriority = s["sitemap_product_priority"] || "0.8";
  for (const product of products) {
    const prodUrl = `${siteUrl}/product/${product.slug}`;
    xml += `
  <url>
    <loc>${prodUrl}</loc>
    <lastmod>${new Date(product.created_at).toISOString().split("T")[0]}</lastmod>
    <changefreq>${defaultChangefreq}</changefreq>
    <priority>${productPriority}</priority>${hreflang(prodUrl)}
  </url>`;
  }

  const skipSlugs = ["home", "about", "contact", "shop", "blog"];
  for (const page of pages) {
    if (skipSlugs.includes(page.slug)) continue;
    const pageUrl = `${siteUrl}/${page.slug}`;
    xml += `
  <url>
    <loc>${pageUrl}</loc>
    <lastmod>${new Date(page.updated_at).toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>${hreflang(pageUrl)}
  </url>`;
  }

  // Branded media URLs
  for (const media of mediaFiles) {
    if (!media.url_slug) continue;
    const mediaUrl = `${siteUrl}/media/${media.url_slug}`;
    xml += `
  <url>
    <loc>${mediaUrl}</loc>
    <lastmod>${new Date(media.created_at).toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>`;
  }

  xml += `
</urlset>`;

  // If ping=true query param, ping Google
  const url = new URL(req.url);
  if (url.searchParams.get("ping") === "true") {
    try {
      await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(siteUrl + "/sitemap.xml")}`);
    } catch {
      // silently fail ping
    }
  }

  return new Response(xml, { headers: corsHeaders });
});
