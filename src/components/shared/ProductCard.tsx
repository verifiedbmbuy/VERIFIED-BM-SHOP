import { forwardRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Star, Shield, Zap, Headphones, MessageCircle, Send, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toBrandedUrl } from "@/lib/imageUtils";

interface Product {
  id: string;
  title: string;
  slug: string;
  short_description?: string;
  price: number;
  sale_price?: number | null;
  category: string;
  badge?: string | null;
  image_url?: string | null;
  rating?: number;
  stock_status?: string;
}

const ProductCard = forwardRef<HTMLDivElement, { product: Product }>(({ product }, ref) => {
  const navigate = useNavigate();
  const discount = product.sale_price && product.price > 0
    ? Math.round(((product.price - product.sale_price) / product.price) * 100)
    : null;
  const inStock = product.stock_status !== "out_of_stock";
  const showSaleBadge = product.sale_price && product.sale_price > 0;
  const displayBadge = showSaleBadge ? "Sale" : product.badge;

  const badgeColors: Record<string, string> = {
    Sale: "bg-[hsl(15,90%,55%)] text-white",
    "Best Seller": "bg-primary text-primary-foreground",
    New: "bg-[hsl(142,70%,45%)] text-white",
    Premium: "bg-[hsl(280,60%,50%)] text-white",
  };

  return (
    <div
      ref={ref}
      onClick={() => navigate(`/product/${product.slug}`)}
      className="group bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 relative flex flex-col h-full cursor-pointer"
    >
      {!inStock && (
        <div className="absolute inset-0 bg-background/60 z-20 flex items-center justify-center pointer-events-none">
          <Badge variant="destructive" className="text-sm px-4 py-1">Out of Stock</Badge>
        </div>
      )}

      {/* Image */}
      <Link to={`/product/${product.slug}`} className="block relative">
        {discount && (
          <span className="absolute top-3 left-3 z-10 bg-[hsl(15,90%,55%)] text-white text-xs font-bold px-2.5 py-1 rounded-full">
            {discount}% SAVE
          </span>
        )}
        {displayBadge && (
          <span className={`absolute top-3 right-3 z-10 text-xs font-bold px-3 py-1 rounded-full ${badgeColors[displayBadge] || "bg-primary text-primary-foreground"}`}>
            {displayBadge}
          </span>
        )}
        <div className="aspect-square bg-secondary overflow-hidden">
          {product.image_url ? (
            <img src={toBrandedUrl(product.image_url)} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" width={400} height={400} decoding="async" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <span className="text-sm">{product.category}</span>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1 justify-between">
        <span className="text-xs font-semibold tracking-wide text-primary uppercase">{product.category}</span>
        <Link to={`/product/${product.slug}`} className="block mt-1.5" onClick={(e) => e.stopPropagation()}>
          <h3 className="font-bold text-foreground text-[15px] leading-snug line-clamp-2 group-hover:text-primary transition-colors">{product.title}</h3>
        </Link>
        {product.short_description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{product.short_description}</p>
        )}

        {/* Rating */}
        <div className="flex items-center gap-0.5 mt-3">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-[hsl(45,93%,47%)] text-[hsl(45,93%,47%)]" />
          ))}
          <span className="text-sm font-medium text-foreground ml-1.5">{product.rating || 5.0}</span>
        </div>

        {/* Price Box */}
        <div className="mt-2 rounded-lg border border-border bg-[hsl(0,60%,97%)] p-3 flex flex-col justify-center flex-1">
          {product.sale_price ? (
            <div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground line-through">${product.price}</span>
                <span className="text-xs font-medium text-[hsl(142,70%,40%)]">Save ${(product.price - product.sale_price).toFixed(2)}</span>
              </div>
              <div className="mt-0.5">
                <span className="text-3xl font-extrabold text-foreground">${product.sale_price}</span>
                <span className="text-sm text-muted-foreground ml-1">USD</span>
              </div>
            </div>
          ) : (
            <div>
              <span className="text-3xl font-extrabold text-foreground">${product.price}</span>
              <span className="text-sm text-muted-foreground ml-1">USD</span>
            </div>
          )}
        </div>

        {/* Trust Icons */}
        <div className="grid grid-cols-3 gap-3 mt-auto pt-4">
          <div className="flex flex-col items-center gap-1.5 rounded-lg bg-muted/50 border border-border py-2.5">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-[10px] font-medium text-muted-foreground">100% Safe</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 rounded-lg bg-muted/50 border border-border py-2.5">
            <Zap className="w-5 h-5 text-primary" />
            <span className="text-[10px] font-medium text-muted-foreground">Instant</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 rounded-lg bg-muted/50 border border-border py-2.5">
            <Headphones className="w-5 h-5 text-primary" />
            <span className="text-[10px] font-medium text-muted-foreground">24/7</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-4">
          <div className="flex gap-2">
            <a
              href="https://wa.me/8801302669333"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-lg bg-[hsl(142,70%,45%)] text-white text-sm font-semibold hover:bg-[hsl(142,70%,40%)] transition-colors"
            >
              <MessageCircle className="w-4 h-4" /> WA
            </a>
            <a
              href="https://t.me/Verifiedbmbuy"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-lg bg-[hsl(200,100%,40%)] text-white text-sm font-semibold hover:bg-[hsl(200,100%,35%)] transition-colors"
            >
              <Send className="w-4 h-4" /> TG
            </a>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!inStock) { navigate(`/product/${product.slug}`); return; }
              const item = {
                id: product.id,
                title: product.title,
                price: product.price,
                sale_price: product.sale_price ?? null,
                quantity: 1,
                image_url: product.image_url ?? null,
              };
              navigate("/checkout", { state: { items: [item] } });
            }}
            className="flex items-center justify-center w-full py-2.5 rounded-lg bg-[hsl(25,95%,55%)] text-white text-sm font-semibold hover:bg-[hsl(25,95%,48%)] transition-colors"
          >
            {inStock ? "Buy Now" : "View"}
          </button>
        </div>

        {/* Bottom Verification */}
        <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground mt-3">
          <Check className="w-3.5 h-3.5 text-[hsl(142,70%,45%)]" />
          Verified Account • Delivered Same Day
        </p>
      </div>
    </div>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;
