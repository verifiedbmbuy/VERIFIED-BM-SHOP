import { Clock, FileText, Globe, Zap, Shield, Headphones } from "lucide-react";

const reasons = [
  { icon: <Clock className="w-6 h-6 text-primary" aria-hidden="true" />, title: "5+ Years in Business", desc: "We've been providing verified business solutions since 2019. Our track record speaks for itself." },
  { icon: <FileText className="w-6 h-6 text-primary" aria-hidden="true" />, title: "Real Documentation", desc: "Every verified BM comes with genuine company registration documents — no shortcuts, no fakes." },
  { icon: <Globe className="w-6 h-6 text-primary" aria-hidden="true" />, title: "Worldwide Coverage", desc: "Serving advertisers in 50+ countries. Doesn't matter where you are — we support every time zone." },
  { icon: <Zap className="w-6 h-6 text-primary" aria-hidden="true" />, title: "Same-Day Delivery", desc: "Once payment clears, you receive your Meta advertising asset credentials within minutes. Not hours, not days." },
  { icon: <Shield className="w-6 h-6 text-primary" aria-hidden="true" />, title: "7-Day Guarantee", desc: "Account stopped working? We'll replace it free within 7 days. No questions asked, no exceptions." },
  { icon: <Headphones className="w-6 h-6 text-primary" aria-hidden="true" />, title: "Actual Human Support", desc: "You'll talk to real people on WhatsApp, Telegram, or email. Not bots, not automated menus." },
];

const WhyVBBStore = () => (
  <section className="py-16 bg-background" aria-label="Reasons to choose Verified BM Shop">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold tracking-widest uppercase text-primary text-center">Why Verified BM Shop?</p>
      <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mt-2">Why Advertisers Keep Coming Back</h2>
      <p className="text-muted-foreground text-center mt-4 max-w-2xl mx-auto">
        We're not the only ones selling verified BMs — but we're the <strong>verified business solutions</strong> provider that 10,000+ advertisers trust.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
        {reasons.map((r, i) => (
          <article key={i} className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">{r.icon}</div>
            <h3 className="font-bold text-foreground">{r.title}</h3>
            <p className="text-sm text-muted-foreground mt-2">{r.desc}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default WhyVBBStore;
