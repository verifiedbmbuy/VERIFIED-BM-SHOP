import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import JsonLdSchema from "@/components/seo/JsonLdSchema";
import PageHeader from "@/components/layout/PageHeader";
import {
  Clock, Users, Globe, Star, Shield, Zap, Headphones,
  RefreshCw, DollarSign, TrendingUp, MessageCircle,
  Send, CheckCircle2, ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { usePageContent, usePageComponents } from "@/hooks/usePageContent";
import { WorkSamplesSection, TestimonialsSection, FAQsSection } from "@/components/shared/PageComponents";
import EditableText from "@/components/editor/EditableText";
import { useEditMode } from "@/contexts/EditModeContext";
import { usePageSEO } from "@/hooks/usePageSEO";
import { Button } from "@/components/ui/button";

const About = () => {
  const pageSlug = "about-verified-bm-services";
  const { content: c } = usePageContent(pageSlug);
  const components = usePageComponents(pageSlug);
  const { isEditMode } = useEditMode();
  const { pageSEO } = usePageSEO(pageSlug);

  const stats = [
    { icon: Clock, value: "5+", label: "Years Experience", color: "hsl(var(--primary))" },
    { icon: Users, value: "10,000+", label: "Happy Customers", color: "hsl(142,70%,45%)" },
    { icon: Globe, value: "50+", label: "Countries Served", color: "hsl(200,100%,40%)" },
    { icon: Star, value: "4.9/5", label: "Satisfaction Rating", color: "hsl(45,100%,50%)" },
  ];

  const features = [
    { icon: Shield, title: "100% Verified Accounts", desc: "Every account is verified through Meta's official process with genuine business documentation." },
    { icon: Zap, title: "Instant Delivery", desc: "Get your account credentials within 1–4 hours after payment confirmation. Many delivered in minutes." },
    { icon: RefreshCw, title: "7-Day Free Replacement", desc: "If your account has any issues within 7 days, we replace it at no cost — no questions asked." },
    { icon: Headphones, title: "24/7 Human Support", desc: "Real people on WhatsApp, Telegram, and email. Not bots. Available around the clock." },
    { icon: DollarSign, title: "Secure Crypto Payments", desc: "Pay safely with USDT (TRC20), Bitcoin, or Ethereum. Fast, private, and hassle-free." },
    { icon: TrendingUp, title: "Built for Scale", desc: "From solo media buyers to large agencies — we scale with your advertising needs." },
  ];

  const timeline = [
    { year: "2019", title: "The Beginning", desc: "Started with a vision to provide legit, verified Business Manager accounts to advertisers worldwide." },
    { year: "2020", title: "Growing Fast", desc: "Crossed 1,000 satisfied customers. Expanded to WhatsApp Business API and Google Ads accounts." },
    { year: "2022", title: "Trusted by Thousands", desc: "Reached 5,000+ customers across 30+ countries with a consistent 4.9/5 satisfaction rating." },
    { year: "2024", title: "Industry Leader", desc: "Now serving 10,000+ advertisers in 50+ countries. Recognized as the #1 verified BM provider." },
  ];

  return (
    <Layout>
      <SEOHead
        title={pageSEO?.meta_title || pageSEO?.title || "About Us — Verified BM Shop"}
        description={pageSEO?.meta_description || "Learn about Verified BM Shop — the #1 trusted provider of verified Facebook Business Managers. 10,000+ advertisers in 50+ countries."}
      />
      <JsonLdSchema
        pageTitle={pageSEO?.meta_title || pageSEO?.title || "About Us"}
        pageDescription={pageSEO?.meta_description || "Learn about Verified BM Shop — trusted by 10,000+ advertisers in 50+ countries."}
        breadcrumbs={[{ name: "Home", url: "/" }, { name: "About Us", url: "/about" }]}
      />

      <PageHeader
        breadcrumb="About Us"
        subtitle="WHO WE ARE"
        title={c.page_title || pageSEO?.title || "Trusted by 10,000+ Advertisers Worldwide"}
        description={c.page_description || pageSEO?.meta_description || "The #1 verified Business Manager provider since 2019."}
      />

      {/* Animated Stats Bar */}
      <section className="relative -mt-8 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-2xl p-5 text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: `${s.color}15` }}
                >
                  <s.icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <p className="text-2xl font-extrabold text-foreground">{s.value}</p>
                <p className="text-xs font-medium text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left — Text */}
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary mb-5">
                <Star className="h-3.5 w-3.5 fill-primary" /> Our Story
              </span>
              <EditableText
                fieldKey="about_heading"
                value={c.about_heading || ""}
                fallback="We Make Meta Advertising Accessible to Everyone"
                as="h2"
                className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight"
              />
              <EditableText
                fieldKey="about_text"
                value={c.about_text || ""}
                fallback="Verified BM Shop started in 2019 with one clear mission — give advertisers worldwide access to legitimate, verified Facebook Business Manager accounts without the headache. We saw how many marketers struggled with unverified accounts, bans, and unreliable sellers. So we built something different: a transparent, secure, and fast service backed by real documentation and real people. Today, over 10,000 advertisers in 50+ countries trust us to power their campaigns."
                as="div"
                className="text-muted-foreground mt-5 text-sm leading-relaxed"
                richText
              />
            </div>

            {/* Right — Highlight Cards */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Shield, value: "100%", label: "Verified Accounts", accent: "hsl(var(--primary))" },
                { icon: Zap, value: "1–4 hrs", label: "Avg. Delivery", accent: "hsl(142,70%,45%)" },
                { icon: RefreshCw, value: "7 Days", label: "Free Replacement", accent: "hsl(200,100%,40%)" },
                { icon: Headphones, value: "24/7", label: "Human Support", accent: "hsl(45,100%,50%)" },
              ].map((card, i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-2xl p-5 text-center hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                    style={{ backgroundColor: `${card.accent}15` }}
                  >
                    <card.icon className="w-5 h-5" style={{ color: card.accent }} />
                  </div>
                  <p className="text-xl font-extrabold text-foreground">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What Sets Us Apart */}
      <section className="py-16 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold tracking-widest uppercase text-primary">Why Choose Us</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mt-2">
              What Sets Verified BM Shop Apart
            </h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
              We don't just sell accounts — we deliver peace of mind with every purchase.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="group bg-card border border-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold text-foreground text-base">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision — Side by Side */}
      <section className="py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Mission */}
            <div className="bg-card border border-border rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-5">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <EditableText
                fieldKey="mission_title"
                value={c.mission_title || ""}
                fallback="Our Mission"
                as="h2"
                className="text-2xl font-extrabold text-foreground"
              />
              <EditableText
                fieldKey="mission_text"
                value={c.mission_text || ""}
                fallback="To provide advertisers worldwide with the highest-quality verified Business Manager accounts and digital advertising tools — at competitive prices, with genuine documentation, and backed by exceptional human support."
                as="div"
                className="text-muted-foreground mt-4 text-sm leading-relaxed"
                richText
              />
            </div>
            {/* Vision */}
            <div className="bg-card border border-border rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-[hsl(142,70%,45%)]" />
              <div className="w-12 h-12 bg-[hsl(142,70%,45%)]/10 rounded-xl flex items-center justify-center mb-5">
                <Globe className="w-5 h-5 text-[hsl(142,70%,45%)]" />
              </div>
              <EditableText
                fieldKey="vision_title"
                value={c.vision_title || ""}
                fallback="Our Vision"
                as="h2"
                className="text-2xl font-extrabold text-foreground"
              />
              <EditableText
                fieldKey="vision_text"
                value={c.vision_text || ""}
                fallback="To become the world's most trusted marketplace for verified digital advertising accounts — where every advertiser, from solo media buyers to enterprise agencies, can scale their campaigns with confidence."
                as="div"
                className="text-muted-foreground mt-4 text-sm leading-relaxed"
                richText
              />
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 bg-secondary/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold tracking-widest uppercase text-primary">Our Journey</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mt-2">From Startup to Industry Leader</h2>
          </div>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-border md:-translate-x-px" />
            <div className="space-y-10">
              {timeline.map((item, i) => (
                <div
                  key={i}
                  className={`relative flex items-start gap-6 md:gap-8 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
                >
                  {/* Content */}
                  <div className={`flex-1 ml-14 md:ml-0 ${i % 2 === 0 ? "md:text-right md:pr-12" : "md:text-left md:pl-12"}`}>
                    <span className="text-xs font-bold text-primary tracking-wider">{item.year}</span>
                    <h3 className="text-lg font-bold text-foreground mt-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                  {/* Dot */}
                  <div className="absolute left-6 md:left-1/2 w-3 h-3 bg-primary rounded-full border-2 border-background -translate-x-1/2 mt-1 z-10" />
                  {/* Spacer */}
                  <div className="hidden md:block flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-foreground">Why Advertisers Trust Us</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              "Official Meta-verified documentation",
              "No recycled or previously banned accounts",
              "Transparent pricing — no hidden fees",
              "Proven 5-year track record",
              "Same-day delivery on most products",
              "Free replacement within 7 days",
              "Real human support — not chatbots",
              "Trusted by agencies and solo buyers",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-card border border-border rounded-xl p-4">
                <CheckCircle2 className="w-5 h-5 text-[hsl(142,70%,45%)] shrink-0 mt-0.5" />
                <span className="text-sm text-foreground font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <EditableText
            fieldKey="cta_title"
            value={c.cta_title || ""}
            fallback="Ready to Get Started?"
            as="h2"
            className="text-3xl md:text-4xl font-extrabold text-primary-foreground"
          />
          <EditableText
            fieldKey="cta_text"
            value={c.cta_text || ""}
            fallback="Whether you need a single verified BM or agency-level accounts, we've got you covered. Talk to our team today."
            as="p"
            className="text-primary-foreground/80 mt-4 text-base max-w-xl mx-auto"
          />
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <a href="https://wa.me/8801302669333" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="h-12 rounded-xl px-8 font-bold bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white gap-2">
                <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
              </Button>
            </a>
            <a href="https://t.me/Verifiedbmbuy" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="h-12 rounded-xl px-8 font-bold bg-[hsl(200,100%,40%)] hover:bg-[hsl(200,100%,35%)] text-white gap-2">
                <Send className="w-4 h-4" /> Chat on Telegram
              </Button>
            </a>
            <Link to="/shop">
              <Button size="lg" variant="secondary" className="h-12 rounded-xl px-8 font-bold gap-2">
                Browse Products <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Dynamic Components */}
      {components.work_samples && <WorkSamplesSection />}
      {components.testimonials && <TestimonialsSection />}
      {components.faqs && <FAQsSection />}
    </Layout>
  );
};

export default About;
