import { Shield, Globe, Clock, Users } from "lucide-react";
import EditableText from "@/components/editor/EditableText";
import { usePageContent } from "@/hooks/usePageContent";

const AboutSection = () => {
  const { content } = usePageContent("verified-bm");

  return (
  <section className="py-16 bg-secondary/30" aria-label="About Verified BM Shop">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <EditableText
        fieldKey="about_section_label"
        value={content.about_section_label || ""}
        fallback="About Verified BM Shop"
        as="p"
        className="text-sm font-semibold tracking-widest uppercase text-primary text-center"
      />
      <EditableText
        fieldKey="about_title"
        value={content.about_title || ""}
        fallback="Your Trusted Partner in Meta Advertising"
        as="h2"
        className="text-3xl md:text-4xl font-bold text-foreground text-center mt-2"
      />

      <div className="max-w-3xl mx-auto mt-8 space-y-4 text-muted-foreground text-center">
        <EditableText
          fieldKey="about_text"
          value={content.about_text || ""}
          fallback="<p>Verified BM Shop started with a simple idea: advertisers need <strong>reliable, verified business solutions</strong> without the hassle. We sell verified Facebook Business Managers, WhatsApp Business API accounts, Facebook Ads accounts, TikTok Ads, Google Ads, and reinstated profiles — all backed by genuine documentation.</p><p>Every <strong>Meta advertising asset</strong> we sell comes with real company verification documents. We don't cut corners on verification — that's why our customers keep coming back and referring others.</p><p>Over the past <strong>5+ years</strong>, we've served more than <strong>10,000 customers in 50+ countries</strong>. Whether you're a solo media buyer or an agency managing dozens of clients, we make it easy to get the verified accounts you need and start <strong>scaling your e-commerce advertising</strong> right away.</p>"
          as="div"
          richText
        />
        <EditableText
          fieldKey="about_address"
          value={content.about_address || ""}
          fallback="Verified BM Shop, Madergonj, Pirgonj, Rangpur, Bangladesh - 5470"
          as="address"
          className="text-sm not-italic"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12" role="list" aria-label="Company statistics">
        {[
          { icon: <Shield className="w-6 h-6 text-primary" aria-hidden="true" />, value: "100%", label: "Verified Accounts" },
          { icon: <Globe className="w-6 h-6 text-primary" aria-hidden="true" />, value: "50+", label: "Countries Served" },
          { icon: <Clock className="w-6 h-6 text-primary" aria-hidden="true" />, value: "5+", label: "Years Experience" },
          { icon: <Users className="w-6 h-6 text-primary" aria-hidden="true" />, value: "10K+", label: "Happy Customers" },
        ].map((s, i) => (
          <div key={i} className="text-center" role="listitem">
            <div className="flex justify-center mb-2">{s.icon}</div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
  );
};

export default AboutSection;
