import { BadgeCheck, Shield, LayoutGrid, Globe, DollarSign, Lock } from "lucide-react";

const advantages = [
  { icon: <BadgeCheck className="w-6 h-6 text-primary" aria-hidden="true" />, title: "Genuine Meta Verification", desc: "Every account is backed by real business documents. No fakes, no workarounds — just legitimate verification through Meta's official process." },
  { icon: <Shield className="w-6 h-6 text-primary" aria-hidden="true" />, title: "Built for Long-Term Use", desc: "Verified BMs carry inherent trust with Meta, making them far more resistant to bans, restrictions, and enforcement actions." },
  { icon: <LayoutGrid className="w-6 h-6 text-primary" aria-hidden="true" />, title: "Multi-Account Management", desc: "Run multiple ad accounts, tracking pixels, and product catalogs all under one verified Business Manager." },
  { icon: <Globe className="w-6 h-6 text-primary" aria-hidden="true" />, title: "No Geographic Limits", desc: "Advertise across all Meta platforms in any country without geographic restrictions on your campaigns." },
  { icon: <DollarSign className="w-6 h-6 text-primary" aria-hidden="true" />, title: "Higher Daily Spend Limits", desc: "Verified accounts unlock spending levels that unverified accounts can only dream of — essential for e-commerce scaling." },
  { icon: <Lock className="w-6 h-6 text-primary" aria-hidden="true" />, title: "Enterprise-Level Security", desc: "Two-factor authentication, admin controls, and business-grade security come standard with every verified BM." },
];

const KeyAdvantages = () => (
  <section className="py-16 bg-secondary/30" aria-label="Key advantages of verified Meta advertising assets">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold tracking-widest uppercase text-primary text-center">Key Advantages</p>
      <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mt-2">What Makes Verified BM Assets Different</h2>
      <p className="text-muted-foreground text-center mt-4 max-w-2xl mx-auto">
        Real advantages that directly impact your <strong>advertising performance</strong> and bottom line — this is why verified matters.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
        {advantages.map((a, i) => (
          <article key={i} className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">{a.icon}</div>
            <h3 className="font-bold text-foreground">{a.title}</h3>
            <p className="text-sm text-muted-foreground mt-2">{a.desc}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default KeyAdvantages;
