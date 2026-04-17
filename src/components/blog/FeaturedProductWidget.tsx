import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toBrandedUrl } from "@/lib/imageUtils";
import { ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Product {
  id: string;
  title: string;
  slug: string;
  price: number;
  sale_price: number | null;
  image_url: string | null;
  rating: number | null;
  short_description: string | null;
}

const FeaturedProductWidget = () => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("products")
        .select("id, title, slug, price, sale_price, image_url, rating, short_description")
        .eq("is_featured", true)
        .eq("stock_status", "in_stock")
        .order("sort_order", { ascending: true })
        .limit(2);
      if (data) setProducts(data);
    };
    fetch();
  }, []);

  if (products.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-bold text-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
        <ShoppingCart className="w-4 h-4 text-primary" /> Featured Products
      </h3>
      <div className="space-y-4">
        {products.map((p) => (
          <Link
            key={p.id}
            to={`/product/${p.slug}`}
            className="block group"
          >
            {p.image_url && (
              <img
                src={toBrandedUrl(p.image_url)}
                alt={p.title}
                loading="lazy"
                className="w-full aspect-[16/9] object-cover rounded-lg mb-2 group-hover:opacity-90 transition-opacity"
              />
            )}
            <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
              {p.title}
            </h4>
            {p.rating && (
              <div className="flex items-center gap-1 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${i < Math.round(p.rating!) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
                  />
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 mt-1.5">
              {p.sale_price ? (
                <>
                  <span className="text-sm font-bold text-primary">${p.sale_price}</span>
                  <span className="text-xs text-muted-foreground line-through">${p.price}</span>
                </>
              ) : (
                <span className="text-sm font-bold text-primary">${p.price}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
      <Button asChild variant="outline" className="w-full mt-4" size="sm">
        <Link to="/shop">View All Products</Link>
      </Button>
    </div>
  );
};

export default FeaturedProductWidget;
