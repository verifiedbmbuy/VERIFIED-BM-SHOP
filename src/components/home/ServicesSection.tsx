import { Shield, MessageSquare, Megaphone, UserCheck, Tv2, Package, Settings, UserCog } from "lucide-react";

const services = [
  { icon: <Shield className="w-8 h-8 text-primary" aria-hidden="true" />, title: "Verified Business Managers", desc: "Meta-approved BMs with real documentation and top trust scores — ready for serious advertising at scale." },
  { icon: <MessageSquare className="w-8 h-8 text-primary" aria-hidden="true" />, title: "WhatsApp Business API", desc: "Enterprise WABA accounts configured for chatbots, bulk messaging, and omnichannel customer support." },
  { icon: <Megaphone className="w-8 h-8 text-primary" aria-hidden="true" />, title: "Facebook Ads Accounts", desc: "Ad accounts with various spending limits so you can launch Meta advertising campaigns right away." },
  { icon: <UserCheck className="w-8 h-8 text-primary" aria-hidden="true" />, title: "Reinstated Profiles", desc: "Recovered Facebook profiles with clean records, full functionality, and good standing with Meta." },
  { icon: <Tv2 className="w-8 h-8 text-primary" aria-hidden="true" />, title: "TikTok & Google Ads", desc: "Ready-to-use ad accounts for TikTok and Google. Start running cross-platform campaigns on day one." },
  { icon: <Package className="w-8 h-8 text-primary" aria-hidden="true" />, title: "Bulk Orders for Agencies", desc: "Need 10, 50, or 100 verified accounts? We offer volume pricing for agencies and resellers." },
  { icon: <Settings className="w-8 h-8 text-primary" aria-hidden="true" />, title: "Custom Account Setups", desc: "We'll configure verified business solutions to match your exact requirements — just tell us what you need." },
  { icon: <UserCog className="w-8 h-8 text-primary" aria-hidden="true" />, title: "Dedicated Account Manager", desc: "Large orders get a personal point of contact for smooth onboarding and ongoing support." },
];

const ServicesSection = () => (
  <section className="py-16 bg-secondary/30" aria-label="Our digital advertising services">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold tracking-widest uppercase text-primary text-center">Our Services</p>
      <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mt-2">Verified Business Solutions We Offer</h2>
      <p className="text-muted-foreground text-center mt-4 max-w-2xl mx-auto">
        Everything you need to run <strong>Meta advertising</strong> at scale — verified BMs, WhatsApp API, ad accounts, and more, all from one trusted provider.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
        {services.map((s, i) => (
          <article key={i} className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow text-center">
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">{s.icon}</div>
            <h3 className="font-bold text-foreground">{s.title}</h3>
            <p className="text-sm text-muted-foreground mt-2">{s.desc}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default ServicesSection;
