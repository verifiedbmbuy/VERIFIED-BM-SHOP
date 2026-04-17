import { memo } from "react";
import { Headphones, Zap, RefreshCw } from "lucide-react";

const features = [
  {
    icon: Headphones,
    title: "24/7 Expert Support",
    subtitle: "Talk to a Real Person",
    description: "Got a question about your verified Business Manager or WhatsApp API? Our support team is available around the clock — real experts who understand Meta advertising assets inside and out.",
  },
  {
    icon: Zap,
    title: "Instant Account Delivery",
    subtitle: "No Waiting Around",
    description: "Pay, contact us, and receive your verified BM credentials right away. No delays, no back-and-forth — just fast, secure delivery so you can start scaling your e-commerce campaigns immediately.",
  },
  {
    icon: RefreshCw,
    title: "7-Day Replacement Guarantee",
    subtitle: "We've Got Your Back",
    description: "If something goes wrong with your account in the first 7 days (and it's not your doing), we'll replace it free of charge. Every verified business solution we sell is backed by this promise.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="pt-3 pb-6 bg-background" aria-label="Why choose Verified BM Shop">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="sr-only">Why Advertisers Choose Verified BM Shop</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <article
                key={i}
                className="bg-card border border-border rounded-xl p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-hero-fade-up"
                style={{ animationDelay: `${0.1 + i * 0.15}s` }}
              >
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <Icon className="w-7 h-7 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-foreground">{feature.title}</h3>
                <p className="text-sm font-semibold text-primary mt-1">{feature.subtitle}</p>
                <p className="text-muted-foreground mt-4 text-sm leading-relaxed">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default memo(FeaturesSection);
