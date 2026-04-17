import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import PageHeader from "@/components/layout/PageHeader";
import { Clock, ArrowRight } from "lucide-react";
import { usePageSEO } from "@/hooks/usePageSEO";
import { toBrandedUrl } from "@/lib/imageUtils";

const categories = ["All", "Verified BM", "WhatsApp API", "Tips & Guides", "Guides"];

const Blog = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { pageSEO } = usePageSEO("blog");

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase.from("blog_posts").select("*").order("published_at", { ascending: false });
      setPosts(data || []);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  const filtered = activeCategory === "All" ? posts : posts.filter((p) => p.category === activeCategory);

  return (
    <Layout>
      <SEOHead title={pageSEO?.meta_title || pageSEO?.title || "Blog - Insights & Guides"} description={pageSEO?.meta_description || "Expert tips, industry insights, and guides on Meta advertising, verified Business Managers, WhatsApp API, and digital marketing strategies."} />
      <PageHeader
        breadcrumb="Blog"
        subtitle="Our Blog"
        title={pageSEO?.title || "Insights & Guides"}
        description={pageSEO?.meta_description || "Expert tips, industry insights, and guides on Meta advertising, verified Business Managers, and WhatsApp API."}
      />

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-background border border-border text-foreground hover:bg-accent"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading posts...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No blog posts found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((post) => (
                <Link key={post.id} to={`/blog/${post.slug}`} className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-primary/10 overflow-hidden">
                    {post.featured_image ? (
                      <img src={toBrandedUrl(post.featured_image)} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary font-bold text-lg uppercase">{post.category}</div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.read_time}</span>
                      <span>•</span>
                      <span>{new Date(post.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{post.title}</h3>
                    <span className="inline-block mt-2 text-xs font-semibold text-primary uppercase">{post.category}</span>
                    {post.excerpt && <p className="text-sm text-muted-foreground mt-3 line-clamp-3">{post.excerpt}</p>}
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-4">
                      Read More <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Blog;
