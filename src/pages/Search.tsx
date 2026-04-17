import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import { Search as SearchIcon, Clock, ArrowRight, Tag } from "lucide-react";
import { toBrandedUrl } from "@/lib/imageUtils";

const STOP_WORDS = new Set([

  "the","is","at","which","on","a","an","and","or","but","in","with","to","for",
  "of","it","this","that","was","are","be","has","have","had","do","does","did",
  "will","would","could","should","may","might","can","from","by","as","its",
]);

const SUGGESTED_CATEGORIES = [
  { label: "Verified BM", path: "/shop" },
  { label: "WhatsApp API", path: "/shop" },
  { label: "Blog & Guides", path: "/blog" },
  { label: "Facebook Accounts", path: "/shop" },
  { label: "TikTok Ads", path: "/shop" },
];

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [input, setInput] = useState(query);
  const [results, setResults] = useState<{ posts: any[]; products: any[] }>({ posts: [], products: [] });
  const [loading, setLoading] = useState(false);

  const cleanQuery = (q: string) =>
    q.toLowerCase().split(/\s+/).filter((w) => w.length > 1 && !STOP_WORDS.has(w));

  useEffect(() => {
    if (!query.trim()) { setResults({ posts: [], products: [] }); return; }
    const keywords = cleanQuery(query);
    if (keywords.length === 0) { setResults({ posts: [], products: [] }); return; }

    const search = async () => {
      setLoading(true);
      const searchTerm = `%${keywords.join("%")}%`;

      const [postsRes, productsRes] = await Promise.all([
        supabase
          .from("blog_posts")
          .select("id, title, slug, excerpt, category, read_time, published_at, featured_image")
          .eq("status", "published")
          .or(`title.ilike.${searchTerm},excerpt.ilike.${searchTerm},content.ilike.${searchTerm}`)
          .order("published_at", { ascending: false })
          .limit(20),
        supabase
          .from("products")
          .select("id, title, slug, short_description, category, price, sale_price, image_url, badge")
          .or(`title.ilike.${searchTerm},description.ilike.${searchTerm},short_description.ilike.${searchTerm}`)
          .limit(20),
      ]);

      setResults({ posts: postsRes.data || [], products: productsRes.data || [] });
      setLoading(false);
    };
    search();
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) setSearchParams({ q: input.trim() });
  };

  const totalResults = results.posts.length + results.products.length;
  const hasQuery = query.trim().length > 0;

  return (
    <Layout>
      <SEOHead title={hasQuery ? `Search: ${query}` : "Search"} description="Search Verified BM Shop for products, blog posts, and guides." noIndex />
      
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-foreground text-center mb-8">Search</h1>

          <form onSubmit={handleSubmit} className="relative mb-10">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search products, blog posts, guides…"
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-border bg-background text-foreground text-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </form>

          {loading && <p className="text-center text-muted-foreground py-8">Searching…</p>}

          {!loading && hasQuery && totalResults === 0 && (
            <div className="text-center py-12 space-y-6">
              <p className="text-lg text-muted-foreground">No results found for "<span className="font-semibold text-foreground">{query}</span>"</p>
              <p className="text-muted-foreground">Try a different keyword or browse our categories:</p>
              <div className="flex flex-wrap justify-center gap-3">
                {SUGGESTED_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.label}
                    to={cat.path}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card text-sm font-medium text-foreground hover:bg-accent transition-colors"
                  >
                    <Tag className="w-3.5 h-3.5 text-primary" />
                    {cat.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {!loading && totalResults > 0 && (
            <div className="space-y-10">
              <p className="text-sm text-muted-foreground">{totalResults} result{totalResults !== 1 ? "s" : ""} for "<span className="font-medium text-foreground">{query}</span>"</p>

              {results.products.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-foreground mb-4">Products ({results.products.length})</h2>
                  <div className="space-y-3">
                    {results.products.map((p) => (
                      <Link key={p.id} to={`/product/${p.slug}`} className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:shadow-md transition-shadow">
                        <div className="w-16 h-16 rounded-lg bg-secondary overflow-hidden shrink-0">
                          {p.image_url ? <img src={toBrandedUrl(p.image_url)} alt={p.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">{p.category}</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{p.title}</h3>
                          <p className="text-sm text-muted-foreground truncate">{p.short_description}</p>
                          <span className="text-sm font-bold text-primary">${p.sale_price || p.price}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {results.posts.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-foreground mb-4">Blog Posts ({results.posts.length})</h2>
                  <div className="space-y-3">
                    {results.posts.map((post) => (
                      <Link key={post.id} to={`/blog/${post.slug}`} className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:shadow-md transition-shadow">
                        <div className="w-16 h-16 rounded-lg bg-secondary overflow-hidden shrink-0">
                          {post.featured_image ? <img src={toBrandedUrl(post.featured_image)} alt={post.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">{post.category}</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{post.title}</h3>
                          {post.excerpt && <p className="text-sm text-muted-foreground truncate">{post.excerpt}</p>}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Clock className="w-3 h-3" /> {post.read_time}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Search;
