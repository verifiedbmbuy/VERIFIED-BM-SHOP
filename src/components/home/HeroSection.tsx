import { memo, useMemo } from "react";
import { Shield, Award, Clock, Truck, Star, MessageCircle, Send, Facebook, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBranding } from "@/hooks/useBranding";
import { getAdminMediaUrl, toBrandedUrl } from "@/lib/imageUtils";

const stats = [
  { icon: Shield, label: "Verified Accounts", value: "100%" },
  { icon: Award, label: "Best Quality", value: "A+ Rated" },
  { icon: Clock, label: "On Market", value: "5+ Years" },
  { icon: Truck, label: "Delivery", value: "Instant" },
];

const HeroSection = () => {
  const { branding } = useBranding();
  const staticHeroFallback = "/images/vbb-logo.png";
  const heroLogo = useMemo(() => {
    if (branding.homepage_hero_logo) return toBrandedUrl(branding.homepage_hero_logo);
    return getAdminMediaUrl("branding/vbb-logo.png");
  }, [branding.homepage_hero_logo]);

  return (
    <section
      className="relative overflow-hidden bg-background pt-10 pb-3 md:pt-12 md:pb-4"
      aria-label="Buy verified Business Manager and WhatsApp API accounts"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Main two-column layout */}
        <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:gap-16 w-full">
          {/* Left — Hero logo with rotating border */}
          <div
            className="flex shrink-0 items-center justify-center w-full lg:w-auto animate-hero-fade-left"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="relative rounded-3xl p-[2px] shadow-2xl shadow-primary/10 overflow-hidden">
                <div
                  className="pointer-events-none absolute inset-[-45%] animate-hero-border-rotate"
                  style={{
                    background: "conic-gradient(from 0deg, hsl(var(--primary)), hsl(22 90% 55%), hsl(var(--primary)), hsl(22 90% 55%))",
                  }}
                />
                <img
                  src={heroLogo}
                  alt="Verified BM Shop — trusted provider of verified Meta Business Manager and WhatsApp API accounts"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (img.src !== window.location.origin + staticHeroFallback) {
                      img.src = staticHeroFallback;
                    }
                  }}
                  className="relative z-10 h-56 w-56 rounded-[21px] object-contain sm:h-64 sm:w-64 md:h-72 md:w-72 lg:h-64 lg:w-64 bg-background"
                  loading="eager"
                  fetchPriority="high"
                  decoding="sync"
                  width={288}
                  height={288}
                />
            </div>
          </div>

          {/* Right — Content */}
          <div className="flex flex-1 flex-col items-center text-center lg:items-start lg:text-left">
            {/* Badge */}
            <div className="animate-hero-fade-right" style={{ animationDelay: "0.15s" }}>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary">
                <Star className="h-3.5 w-3.5 fill-primary" aria-hidden="true" />
                Trusted by 10,000+ Advertisers
                <span className="h-1.5 w-1.5 rounded-full bg-[hsl(142,70%,45%)] animate-pulse" aria-hidden="true" />
              </div>
            </div>

            {/* H1 — Primary keyword target */}
            <div
              className="mb-5 animate-hero-fade-right"
              style={{ animationDelay: "0.25s" }}
            >
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-[2.75rem] lg:text-[2.85rem] xl:text-[3.25rem]">
                Buy <span className="text-primary">Verified BM</span>
                <span className="mt-3 block text-[1.35rem] sm:text-4xl md:text-[2.75rem] lg:text-[2.85rem] xl:text-[3.25rem]">And <span className="text-[hsl(142,70%,45%)]">WhatsApp Business API</span></span>
              </h1>
            </div>

            {/* Description — keyword-rich, scannable */}
            <p
              className="mb-8 text-sm text-muted-foreground md:text-base leading-relaxed text-center lg:text-justify animate-hero-fade-right"
              style={{ animationDelay: "0.35s" }}
            >
              We sell <strong>verified Facebook Business Managers</strong> and <strong>WhatsApp Business API</strong> accounts — the real deal, with proper documentation. Need Facebook Ads, TikTok Ads, Google Ads accounts, or reinstated profiles? We've got those too. Every <strong>Meta advertising asset</strong> is legit, secure, and ready to use. Over <strong>10,000 advertisers</strong> trust us because we deliver what we promise, fast.
            </p>

            {/* Contact buttons — descriptive anchor text */}
            <nav
              className="flex flex-wrap items-center justify-center lg:justify-start gap-3 lg:gap-4 w-full animate-hero-fade-right"
              aria-label="Contact us via messaging platforms"
              style={{ animationDelay: "0.45s" }}
            >
              <a href="https://wa.me/8801302669333" target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[120px]" aria-label="Chat with us on WhatsApp">
                <Button size="lg" className="w-full h-12 rounded-[9px] px-6 font-bold bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white transition-all">
                  <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" /> WhatsApp
                </Button>
              </a>
              <a href="https://t.me/Verifiedbmbuy" target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[120px]" aria-label="Message us on Telegram">
                <Button size="lg" className="w-full h-12 rounded-[9px] px-6 font-bold bg-[hsl(200,100%,40%)] hover:bg-[hsl(200,100%,35%)] text-white transition-all">
                  <Send className="mr-2 h-4 w-4" aria-hidden="true" /> Telegram
                </Button>
              </a>
              <a href="http://m.me/101736778209833" target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[120px]" aria-label="Contact us on Facebook Messenger">
                <Button size="lg" className="w-full h-12 rounded-[9px] px-6 font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-all">
                  <Facebook className="mr-2 h-4 w-4" aria-hidden="true" /> Facebook
                </Button>
              </a>
              <a href="mailto:info@verifiedbm.shop" className="flex-1 min-w-[120px]" aria-label="Send us an email at info@verifiedbm.shop">
                <Button size="lg" className="w-full h-12 rounded-[9px] px-6 font-bold bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-all">
                  <Mail className="mr-2 h-4 w-4" aria-hidden="true" /> Email
                </Button>
              </a>
            </nav>
          </div>
        </div>

        {/* Stats row — trust signals */}
        <div
          className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6 animate-hero-fade-up"
          style={{ animationDelay: "0.55s" }}
          role="list"
          aria-label="Key trust metrics"
        >
          {stats.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              role="listitem"
              className="group flex flex-col items-center gap-2.5 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-5 w-5 text-primary transition-transform group-hover:scale-110" aria-hidden="true" />
              </div>
              <span className="text-lg font-bold text-foreground">{value}</span>
              <span className="text-xs font-medium text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default memo(HeroSection);
