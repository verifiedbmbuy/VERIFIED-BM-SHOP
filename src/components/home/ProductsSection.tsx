import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/shared/ProductCard";

const categories = ["All", "Verified BM", "WhatsApp API", "Facebook Accounts", "TikTok Ads", "Google Ads", "Reinstated Profiles", "Snapchat Ads"];

const CACHE_KEY = "vbb_products_cache";
const CACHE_TTL = 5 * 60 * 1000;

const ProductsSection = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(6);
  const fetchedRef = useRef(false);

  useEffect(() => {
    const fetchCount = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "homepage_product_count")
        .single();
      if (data?.value) {
        const num = parseInt(data.value, 10);
        if ([3, 6, 9, 12].includes(num)) setDisplayCount(num);
      }
    };
    fetchCount();
  }, []);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          setProducts(data);
          setLoading(false);
        } else {
          setProducts(data);
          setLoading(false);
        }
      } catch { /* corrupt cache */ }
    }

    const fetchProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select("id,title,slug,short_description,price,sale_price,category,badge,image_url,rating,stock_status,sort_order")
        .order("sort_order", { ascending: true });
      if (data) {
        setProducts(data);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const filtered = activeCategory === "All" ? products : products.filter((p) => p.category === activeCategory);
  const displayed = filtered.slice(0, displayCount);

  return (
    <section className="pt-16 pb-8 bg-secondary/30" aria-label="Browse verified BM products and premium ad accounts">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold tracking-widest uppercase text-primary text-center">Our Products</p>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mt-2">Buy Verified BM &amp; Premium Ad Accounts</h2>
        <p className="text-muted-foreground text-center mt-4 max-w-2xl mx-auto">
          Hand-picked <strong>verified Meta advertising assets</strong>, ready to use. Every account comes with real documentation, same-day delivery, and a 7-day replacement guarantee.
        </p>

        <nav className="flex flex-wrap justify-center gap-2 mt-8" aria-label="Filter products by category">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              aria-pressed={activeCategory === cat}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-background border border-border text-foreground hover:bg-accent"
              }`}
            >
              {cat}
            </button>
          ))}
        </nav>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground" role="status">Loading products...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10" role="list" aria-label="Product listings">
            {displayed.map((product, idx) => (
              <div key={product.id} className="flex" role="listitem">
                {idx >= 3 ? (
                  <div className="w-full" style={{ contentVisibility: "auto" }}>
                    <ProductCard product={product} />
                  </div>
                ) : (
                  <ProductCard product={product} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductsSection;
