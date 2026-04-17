/**
 * Build-time Sitemap Generator
 * Fetches the dynamic sitemap from the Edge Function and writes it
 * as a static sitemap.xml into /public so the hosting can serve it directly.
 */

const EDGE_FUNCTION_URL =
  "https://xukkejkvcgixogvbllmf.supabase.co/functions/v1/sitemap";

const SUPABASE_URL = "https://xukkejkvcgixogvbllmf.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1a2tlamt2Y2dpeG9ndmJsbG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMjE5OTUsImV4cCI6MjA4NjY5Nzk5NX0.OAYDM8SFgKAXSN1WMlHkJIwMSA4xwgvH3m05TwUJky0";
const BASE_URL = "https://verifiedbm.shop";

interface BlogPost {
  slug: string;
  published_at: string | null;
}
interface Product {
  slug: string;
  created_at: string;
}
interface Page {
  slug: string;
  updated_at: string;
}

const today = new Date().toISOString().split("T")[0];

const staticPages = [
  { loc: "/", priority: "1.0", changefreq: "daily" },
  { loc: "/shop", priority: "0.9", changefreq: "daily" },
  { loc: "/blog", priority: "0.8", changefreq: "daily" },
  { loc: "/contact", priority: "0.7", changefreq: "monthly" },
  { loc: "/about", priority: "0.7", changefreq: "monthly" },
  { loc: "/faq", priority: "0.6", changefreq: "weekly" },
  { loc: "/terms", priority: "0.4", changefreq: "monthly" },
  { loc: "/privacy", priority: "0.4", changefreq: "monthly" },
  { loc: "/refund-policy", priority: "0.4", changefreq: "monthly" },
  { loc: "/replacement-guarantee", priority: "0.5", changefreq: "monthly" },
];

const skipSlugs = ["home", "about", "contact", "shop", "blog"];

async function supabaseGet<T>(table: string, select: string, filters = ""): Promise<T[]> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${select}${filters}`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${table}: ${res.statusText}`);
  return res.json();
}

function urlEntry(loc: string, lastmod: string, changefreq: string, priority: string): string {
  return `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

async function main() {
  console.log("🗺️  Generating sitemap.xml ...");

  const [posts, products, pages] = await Promise.all([
    supabaseGet<BlogPost>("blog_posts", "slug,published_at", "&status=eq.published&order=published_at.desc"),
    supabaseGet<Product>("products", "slug,created_at", "&order=created_at.desc"),
    supabaseGet<Page>("pages", "slug,updated_at", "&status=eq.published&order=updated_at.desc"),
  ]);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Static pages
  for (const p of staticPages) {
    xml += urlEntry(`${BASE_URL}${p.loc}`, today, p.changefreq, p.priority);
  }

  // Blog posts — priority 0.8
  for (const post of posts) {
    const lastmod = post.published_at
      ? new Date(post.published_at).toISOString().split("T")[0]
      : today;
    xml += urlEntry(`${BASE_URL}/blog/${post.slug}`, lastmod, "weekly", "0.8");
  }

  // Products — priority 0.8
  for (const product of products) {
    const lastmod = new Date(product.created_at).toISOString().split("T")[0];
    xml += urlEntry(`${BASE_URL}/product/${product.slug}`, lastmod, "weekly", "0.8");
  }

  // Dynamic pages
  for (const page of pages) {
    if (skipSlugs.includes(page.slug)) continue;
    const lastmod = new Date(page.updated_at).toISOString().split("T")[0];
    xml += urlEntry(`${BASE_URL}/${page.slug}`, lastmod, "monthly", "0.5");
  }

  xml += `
</urlset>`;

  const fs = await import("fs");
  const path = await import("path");
  const outPath = path.resolve(process.cwd(), "public/sitemap.xml");
  fs.writeFileSync(outPath, xml, "utf-8");

  console.log(`✅ sitemap.xml written → ${posts.length} posts, ${products.length} products, ${pages.length} pages, ${staticPages.length} static`);
}

main().catch((err) => {
  console.error("❌ Sitemap generation failed:", err);
  process.exit(1);
});
