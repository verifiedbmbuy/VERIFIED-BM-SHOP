import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import JsonLdSchema from "@/components/seo/JsonLdSchema";
import ProductCard from "@/components/shared/ProductCard";
import { toBrandedUrl } from "@/lib/imageUtils";
import SocialShareButtons from "@/components/shared/SocialShareButtons";
import { PUBLIC_FAQS, PUBLIC_PRODUCTS, PUBLIC_REVIEWS, PUBLIC_TESTIMONIALS } from "@/data/publicContent";
import {
  Star, Shield, Zap, Headphones, MessageCircle, Send,
  ChevronRight, Home, CheckCircle, XCircle, Lock, Truck,
  RefreshCw, Clock, Globe, Award, FileText, ShieldCheck,
  Wallet, ArrowRight, ChevronDown, Package, CreditCard, Mail
} from "lucide-react";

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  // Review state
  const [reviews, setReviews] = useState<any[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);
  const [existingReview, setExistingReview] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const data = PUBLIC_PRODUCTS.find((item) => item.slug === slug) || null;
      setProduct(data);
      if (data) {
        setActiveImage(data.image_url || "");
        setRelated(PUBLIC_PRODUCTS.filter((item) => item.category === data.category && item.id !== data.id).slice(0, 4));
        setTestimonials([...PUBLIC_TESTIMONIALS]);
        setFaqs([...PUBLIC_FAQS]);
        setReviews([...PUBLIC_REVIEWS]);
      }
      setLoading(false);
    if (slug) {
      // no-op block to preserve effect dependency behavior
    }
  }, [slug]);

  // Scroll to #reviews hash when page loads
  useEffect(() => {
    if (!loading && window.location.hash === "#reviews") {
      setTimeout(() => {
        document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  }, [loading]);

  const handleSubmitReview = async () => {
    toast.info("Reviews are disabled on the static public version of this page.");
  };

  if (loading) return <Layout><div className="py-24 text-center text-muted-foreground">Loading...</div></Layout>;
  if (!product) return <Layout><div className="py-24 text-center text-muted-foreground">Product not found.</div></Layout>;

  const discount = product.sale_price && product.price > 0
    ? Math.round(((product.price - product.sale_price) / product.price) * 100)
    : null;
  const finalPrice = product.sale_price || product.price;
  const allImages = [product.image_url, ...(product.gallery_images || [])].filter(Boolean);
  const inStock = product.stock_status === "in_stock";
  const attrs = product.attributes && typeof product.attributes === "object" ? product.attributes : {};
  const attrEntries = Object.entries(attrs).filter(([key]) => !key.startsWith("_"));
  const productFaqs: { question: string; answer: string }[] = (attrs as any)._faqs || [];
  const headings = (attrs as any)._headings || {};
  const h = (section: string, field: "subtitle" | "title" | "description", fallback: string) =>
    headings[section]?.[field] || fallback;

  // Fallback feature attributes when none are set in admin
  const defaultFeatures: [string, string][] = [
    ["Verified Business Manager", "Fully verified by Meta with real documentation"],
    ["Full Admin Access", "Complete control over all BM settings and assets"],
    ["Ad Account Ready", "Pre-configured for immediate ad campaign launch"],
    ["Anti-Ban Guide", "Includes warm-up strategy and compliance best practices"],
    ["Same-Day Delivery", "Account credentials delivered within 1–4 hours"],
    ["7-Day Replacement", "Free replacement guarantee if any issues arise"],
    ["Secure Handover", "SSL encrypted, private credential transfer"],
    ["24/7 Priority Support", "Round-the-clock assistance via WhatsApp & Telegram"],
    ["Clean Account History", "No prior violations or policy strikes"],
  ];

  const displayFeatures: [string, any][] = attrEntries.length > 0 ? attrEntries as [string, any][] : defaultFeatures;

  // Dynamic spec groups from admin or fallback defaults
  const specGroups: { title: string; items: string[] }[] = (attrs as any)._specs?.length > 0
    ? (attrs as any)._specs
    : [
        { title: "Account Type", items: ["Verified Business Manager", "Full Admin Access", "Meta Verified Status", "Ready-to-use immediately"] },
        { title: "Security & Compliance", items: ["Anti-ban guide included", "Warm-up strategy provided", "SSL encrypted delivery", "Clean account history"] },
        { title: "Delivery & Support", items: ["Same-day delivery (1–4 hrs)", "Setup assistance included", "7-day replacement guarantee", "Priority customer support"] },
      ];


  return (
    <Layout>
      <SEOHead
        title={product.meta_title || `${product.title} - Buy Online | Verified BM Shop`}
        description={product.meta_description || product.short_description || `Buy ${product.title} from Verified BM Shop. Instant delivery and 7-day guarantee.`}
        ogImage={product.image_url || undefined}
        ogType="product"
        keywords={product.focus_keyword || undefined}
      />
      <JsonLdSchema
        pageTitle={product.meta_title || product.title}
        pageDescription={product.meta_description || product.description || ""}
        pageImage={product.image_url}
        product={product}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Shop", url: "/shop" },
          { name: product.title, url: `/product/${product.slug}` },
        ]}
      />

      {/* ─── Breadcrumbs ─── */}
      <div className="bg-muted/30 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
            <Link to="/" className="flex items-center gap-1 hover:text-foreground transition-colors">
              <Home className="w-4 h-4" /> Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/shop" className="hover:text-foreground transition-colors">Shop</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-medium truncate max-w-[300px]">{product.title}</span>
          </nav>
        </div>
      </div>

      {/* ─── 1. HERO SECTION & BUY BOX ─── */}
      <section className="py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

            {/* Left: Product Image Gallery */}
            <div>
              <div className="relative aspect-square bg-secondary rounded-2xl overflow-hidden border border-border">
                {activeImage ? (
                  <img
                    src={toBrandedUrl(activeImage)}
                    alt={product.title}
                    className="w-full h-full object-cover"
                    loading="eager"
                    fetchpriority="high"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-lg">{product.category}</div>
                )}
                {/* Verified Badge Overlay */}
                {product.badge && (
                  <span className="absolute top-4 right-4 z-10 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                    {product.badge}
                  </span>
                )}
                {discount && (
                  <span className="absolute top-4 left-4 z-10 bg-[hsl(15,90%,55%)] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                    {discount}% OFF
                  </span>
                )}
              </div>
              {allImages.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {allImages.map((img: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(img)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${activeImage === img ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"}`}
                    >
                      <img src={toBrandedUrl(img)} alt={`${product.title} view ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}

              {/* Trust Badges Below Image */}
              <div className="grid grid-cols-3 gap-3 mt-6">
                {[
                  { icon: Lock, label: "Secure Payment" },
                  { icon: Truck, label: "Instant Delivery" },
                  { icon: RefreshCw, label: "7-Day Guarantee" },
                ].map((badge, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 md:p-4">
                    <badge.icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                    <span className="text-[10px] md:text-xs font-medium text-muted-foreground text-center leading-tight">{badge.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Buy Box */}
            <div className="flex flex-col">
              

              <h1 className="text-2xl md:text-3xl font-bold text-foreground mt-4 leading-tight">{product.title}</h1>

              {product.sku && (
                <p className="text-xs text-muted-foreground mt-1.5 font-mono">SKU: {product.sku}</p>
              )}

              {/* Rating + Stock */}
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[hsl(45,93%,47%)] text-[hsl(45,93%,47%)]" />
                  ))}
                  <span className="font-semibold text-foreground ml-1">{product.rating || 5.0}</span>
                  <span className="text-muted-foreground text-sm">(128 Reviews)</span>
                </div>
                {inStock ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-[hsl(142,70%,45%)]/10 text-[hsl(142,70%,45%)]">
                    <span className="w-2 h-2 rounded-full bg-[hsl(142,70%,45%)] animate-pulse" /> In Stock
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-destructive/10 text-destructive">
                    <XCircle className="w-3 h-3" /> Out of Stock
                  </span>
                )}
              </div>

              {/* Price Card */}
              <div className="mt-4 rounded-xl border border-border bg-muted/30 px-4 py-3 inline-flex items-baseline gap-2 flex-wrap">
                {product.sale_price ? (
                  <>
                    <span className="text-base text-muted-foreground line-through">${product.price}</span>
                    <span className="text-sm font-medium text-[hsl(142,70%,45%)]">Save ${(product.price - product.sale_price).toFixed(2)} ({discount}%)</span>
                    <span className="text-3xl font-extrabold text-foreground">${product.sale_price}</span>
                  </>
                ) : (
                  <span className="text-3xl font-extrabold text-foreground">${product.price}</span>
                )}
              </div>

              {/* Short Description */}
              {product.short_description && (
                <p className="text-muted-foreground mt-5 leading-relaxed text-sm md:text-base">
                  {product.short_description}
                </p>
              )}


              {/* Quantity Selector & Primary CTA */}
              <div className="flex flex-col gap-3 mt-6">
                {inStock && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">Quantity:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors"
                        disabled={quantity <= 1}
                      >
                        <span className="text-lg font-bold">−</span>
                      </button>
                      <span className="text-base font-semibold w-10 text-center">{quantity}</span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(100, q + 1))}
                        className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors"
                        disabled={quantity >= 100}
                      >
                        <span className="text-lg font-bold">+</span>
                      </button>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => inStock && navigate("/checkout", { state: { items: [{ id: product.id, title: product.title, price: product.price, sale_price: product.sale_price, quantity, image_url: product.image_url }] } })}
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-[hsl(25,95%,55%)] text-white text-lg font-bold hover:bg-[hsl(25,95%,48%)] transition-colors disabled:opacity-50 shadow-lg shadow-[hsl(25,95%,55%)]/20"
                  disabled={!inStock}
                >
                  {inStock ? `Buy Now — $${(finalPrice * quantity).toFixed(2)}` : "Sold Out"} {inStock && <ArrowRight className="w-5 h-5" />}
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <a href="https://wa.me/8801302669333" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[hsl(142,70%,45%)] text-white font-semibold hover:bg-[hsl(142,70%,40%)] transition-colors">
                    <MessageCircle className="w-5 h-5" /> WhatsApp
                  </a>
                  <a href="https://t.me/Verifiedbmbuy" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[hsl(200,100%,40%)] text-white font-semibold hover:bg-[hsl(200,100%,35%)] transition-colors">
                    <Send className="w-5 h-5" /> Telegram
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. DYNAMIC ATTRIBUTES GRID ─── */}
      <section className="py-14 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-bold tracking-widest uppercase text-primary text-center">{h("features", "subtitle", "What You Get")}</p>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mt-2">{h("features", "title", "Product Features & Inclusions")}</h2>
          <p className="text-muted-foreground text-center mt-3 max-w-xl mx-auto">
            {h("features", "description", "Everything included with your purchase — no hidden fees, no surprises.")}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {displayFeatures.map(([key, value]: [string, any], i: number) => (
              <div key={i} className="flex items-start gap-3.5 rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{key}</p>
                  {value && <p className="text-xs text-muted-foreground mt-0.5">{value}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 3A. PRODUCT DETAILS (Specifications) ─── */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-bold tracking-widest uppercase text-primary text-center">{h("specs", "subtitle", "Specifications")}</p>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mt-2">{h("specs", "title", "Product Details")}</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            {specGroups.map((spec, i) => {
              const icons = [ShieldCheck, Shield, Headphones, Globe, Award, Lock];
              const Icon = icons[i % icons.length];
              return (
                <div key={i} className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-bold text-foreground">{spec.title}</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {spec.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-[hsl(142,70%,45%)] mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── FULL DESCRIPTION (Rich Text) ─── */}
      {product.description && (
        <section className="py-14 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-bold tracking-widest uppercase text-primary text-center">{h("description", "subtitle", "Description")}</p>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mt-2">{h("description", "title", "About This Product")}</h2>
            <div
              className="prose prose-sm md:prose-base max-w-none mt-10 text-muted-foreground prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(
                  product.description.includes("<") 
                    ? product.description 
                    : product.description.split("\n\n").map((p: string) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("")
                )
              }}
            />
          </div>
        </section>
      )}

      <section className="py-14 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-bold tracking-widest uppercase text-primary text-center">{h("payment", "subtitle", "Payment")}</p>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mt-2">{h("payment", "title", "How to Make Payment")}</h2>
          <p className="text-muted-foreground text-center mt-3 max-w-xl mx-auto">
            {h("payment", "description", "We accept cryptocurrency payments for secure, fast, and worldwide transactions.")}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            {[
              { step: 1, icon: Package, title: "Choose Your Product", desc: "Select the product you want and click 'Buy Now' or contact us via WhatsApp / Telegram." },
              { step: 2, icon: CreditCard, title: "Complete Payment", desc: "Pay using USDT (TRC20), Bitcoin, or Ethereum to the wallet address provided at checkout." },
              { step: 3, icon: Mail, title: "Receive via Email", desc: "We'll verify your payment and deliver account credentials securely within 1-4 hours." },
            ].map((s) => (
              <div key={s.step} className="rounded-xl border border-border bg-card p-6 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50" />
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl mx-auto mt-2">
                  {s.step}
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mt-3">
                  <s.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mt-3">{s.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {["USDT (TRC20)", "Bitcoin (BTC)", "Ethereum (ETH)", "Other Crypto"].map((method) => (
              <span key={method} className="px-4 py-2 rounded-full bg-card border border-border text-sm font-medium text-foreground hover:border-primary/50 transition-colors">{method}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 3C. DELIVERY PROCESS ─── */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-bold tracking-widest uppercase text-primary text-center">{h("delivery", "subtitle", "Delivery")}</p>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mt-2">{h("delivery", "title", "How We Deliver Your Account")}</h2>
          <p className="text-muted-foreground text-center mt-3 max-w-xl mx-auto">
            {h("delivery", "description", "A fully transparent, secure process from purchase to access.")}
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-10">
            {[
              { step: 1, title: "Payment Verified", desc: "Our team confirms your crypto payment within minutes.", icon: Wallet },
              { step: 2, title: "Account Prepared", desc: "We prepare your verified account with all necessary configurations.", icon: ShieldCheck },
              { step: 3, title: "Credentials Sent", desc: "Login credentials are sent via encrypted message on WhatsApp or Telegram.", icon: Send },
              { step: 4, title: "Setup Support", desc: "Our team guides you through login, setup, and best practices.", icon: Headphones },
            ].map((s) => (
              <div key={s.step} className="rounded-xl border border-border bg-card p-5 md:p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <s.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-xs font-bold text-primary mt-3">Step {s.step}</div>
                <h3 className="font-bold text-foreground mt-1 text-sm md:text-base">{s.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground mt-2 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHY CUSTOMERS CHOOSE Verified BM Shop ─── */}
      <section className="py-14 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-bold tracking-widest uppercase text-primary text-center">{h("whyUs", "subtitle", "Why Verified BM Shop")}</p>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mt-2">{h("whyUs", "title", "Why Customers Choose Us")}</h2>
          <p className="text-muted-foreground text-center mt-3 max-w-xl mx-auto">
            {h("whyUs", "description", "Trusted by 1,000+ advertisers worldwide for verified Meta accounts.")}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
            {[
              { icon: Award, title: "Years of Experience", desc: "We've been serving advertisers for years with consistently high-quality verified Business Managers." },
              { icon: RefreshCw, title: "7-Day Guarantee", desc: "Every purchase is covered by our replacement guarantee. If there's an issue, we replace it — no questions asked." },
              { icon: Zap, title: "Instant Delivery", desc: "Receive your account credentials within 1-4 hours after payment confirmation." },
              { icon: Headphones, title: "24/7 Support", desc: "Our support team is available around the clock via WhatsApp, Telegram, and Email." },
              { icon: Globe, title: "Global Service", desc: "We deliver worldwide with no geographic restrictions. Advertisers from any country can purchase with confidence." },
              { icon: Shield, title: "Replacement Policy", desc: "Accounts come with a full compliance and warm-up guide to minimize risk — plus a free replacement if needed." },
            ].map((item, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mt-4">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VERIFIED BUYER REVIEWS ─── */}
      <section id="reviews" className="py-14 bg-muted/30 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-bold tracking-widest uppercase text-primary text-center">Reviews</p>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mt-2">Verified Buyer Reviews</h2>
          <p className="text-muted-foreground text-center mt-3 max-w-xl mx-auto">
            Only customers who purchased this product can leave a review.
          </p>

          {/* Review Form or Gate */}
          <div className="mt-10 max-w-2xl mx-auto">
            {user && canReview && !existingReview ? (
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" /> Write Your Review
                </h3>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setReviewRating(s)} className="p-0.5">
                      <Star className={`w-6 h-6 ${s <= reviewRating ? "fill-[hsl(45,93%,47%)] text-[hsl(45,93%,47%)]" : "text-muted-foreground"}`} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience with this product…"
                  rows={4}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  onClick={handleSubmitReview}
                  disabled={submittingReview || !reviewText.trim()}
                  className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {submittingReview ? "Submitting…" : "Submit Review"}
                </button>
              </div>
            ) : existingReview ? (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
                <CheckCircle className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="font-semibold text-foreground">You've already reviewed this product</p>
                <p className="text-sm text-muted-foreground mt-1">Thank you for your feedback!</p>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-6 text-center">
                <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="font-semibold text-foreground">Only verified buyers can leave a review</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {user ? "Purchase this product and receive it to leave a review." : "Log in and purchase this product to leave a review."}
                </p>
              </div>
            )}
          </div>

          {/* Existing Reviews */}
          {reviews.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-xl border border-border bg-card p-6">
                  <div className="flex gap-0.5 mb-2">
                    {[...Array(r.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[hsl(45,93%,47%)] text-[hsl(45,93%,47%)]" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground italic leading-relaxed">"{r.review_text}"</p>
                  <div className="mt-3 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-primary">Verified Buyer</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {reviews.length === 0 && (
            <p className="text-center text-sm text-muted-foreground mt-8">No reviews yet. Be the first to review this product!</p>
          )}
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      {testimonials.length > 0 && (
        <section className="py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-bold tracking-widest uppercase text-primary text-center">{h("testimonials", "subtitle", "Testimonials")}</p>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mt-2">{h("testimonials", "title", "What Our Customers Say")}</h2>
            <p className="text-muted-foreground text-center mt-3 max-w-xl mx-auto">
              {h("testimonials", "description", "Real reviews from verified buyers who trust Verified BM Shop.")}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
              {testimonials.map((t) => (
                <div key={t.id} className="rounded-xl border border-border bg-card p-6 hover:shadow-md transition-shadow">
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(t.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[hsl(45,93%,47%)] text-[hsl(45,93%,47%)]" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground italic leading-relaxed">"{t.testimonial_text}"</p>
                  <div className="mt-4 flex items-center gap-3">
                    {t.avatar_url ? (
                      <img src={toBrandedUrl(t.avatar_url)} alt={t.client_name} className="w-10 h-10 rounded-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {t.client_name?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.client_name}</p>
                      {t.job_title && <p className="text-xs text-muted-foreground">{t.job_title}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── FAQ ─── */}
      {(productFaqs.length > 0 || faqs.length > 0) && (
        <section className="py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-bold tracking-widest uppercase text-primary text-center">{h("faq", "subtitle", "FAQ")}</p>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mt-2">{h("faq", "title", "Frequently Asked Questions")}</h2>
            <p className="text-muted-foreground text-center mt-3">Common questions about {product.title}.</p>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...productFaqs.map((f: any, i: number) => ({ id: `pf-${i}`, question: f.question, answer: f.answer })), ...faqs].map((faq: any) => (
                <div key={faq.id} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                  <button
                    onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors"
                  >
                    <span className="font-medium text-foreground pr-4">{faq.question}</span>
                    <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200 ${openFaq === faq.id ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === faq.id && (
                    <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── RELATED PRODUCTS ─── */}
      {related.length > 0 && (
        <section className="py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-foreground">Related Products</h2>
              <Link to="/shop" className="text-primary font-medium text-sm hover:underline flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ─── SOCIAL SHARE ─── */}
      <section className="pb-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-border pt-6">
            <SocialShareButtons
              url={`/product/${product.slug}`}
              title={product.title}
              description={product.meta_description || product.short_description}
              image={product.image_url}
              contentType="product"
              contentId={product.id}
            />
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ProductDetail;
