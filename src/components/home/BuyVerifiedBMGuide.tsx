import { CheckCircle, LayoutGrid, MessageSquare, Target, Share2, UserCog } from "lucide-react";

const BuyVerifiedBMGuide = () => (
  <section className="py-16 bg-secondary/30" aria-label="Complete guide to buying verified Business Manager accounts">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold tracking-widest uppercase text-primary text-center">Complete Guide</p>
      <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mt-2">Buy Verified BM — Everything You Need to Know</h2>
      <p className="text-muted-foreground text-center mt-4 max-w-2xl mx-auto">
        Why a <strong>verified Facebook Business Manager</strong> matters for your advertising success, and how Verified BM Shop delivers the best <strong>Meta advertising assets</strong> on the market.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
        <article className="bg-card border border-border rounded-xl p-8">
          <h3 className="text-xl font-bold text-foreground">What Is a Verified Business Manager?</h3>
          <p className="text-muted-foreground mt-3 text-sm">
            A <strong>Meta-approved account</strong> that has passed identity and business verification using legitimate company documents, earning the highest trust level for advertising.
          </p>
          <ul className="mt-4 space-y-2">
            {["Fewer ad rejections and faster approvals", "Higher daily and lifetime spending limits", "Access to advanced Meta advertising features", "Better protection against sudden account bans"].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-[hsl(142,70%,45%)] mt-0.5 flex-shrink-0" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </article>

        <article className="bg-card border border-border rounded-xl p-8">
          <h3 className="text-xl font-bold text-foreground">Why Buy from Verified BM Shop?</h3>
          <p className="text-muted-foreground mt-3 text-sm">
            The most trusted source for <strong>verified business solutions</strong> for over five years. Here's what makes us different:
          </p>
          <ul className="mt-4 space-y-2">
            {[
              "Real documents — verified through Meta's official process",
              "Instant delivery — credentials within minutes",
              "7-day guarantee — free replacement if anything goes wrong",
              "Full documentation — all verification documents included",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-[hsl(142,70%,45%)] mt-0.5 flex-shrink-0" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </article>

        <article className="bg-card border border-border rounded-xl p-8">
          <h3 className="text-xl font-bold text-foreground">How Verified BM Improves Ad Performance</h3>
          <p className="text-muted-foreground mt-3 text-sm">
            Meta's algorithm favors verified accounts, giving you a real competitive advantage for <strong>e-commerce scaling</strong>:
          </p>
          <ul className="mt-4 space-y-2">
            {["Lower cost per click (CPC) in ad auctions", "Better reach and ad delivery priority", "Faster ad review and approval times", "Access to premium targeting and Custom Audiences"].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-[hsl(142,70%,45%)] mt-0.5 flex-shrink-0" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </article>

        <article className="bg-card border border-border rounded-xl p-8">
          <h3 className="text-xl font-bold text-foreground">Trusted by 10,000+ Advertisers Worldwide</h3>
          <p className="text-muted-foreground mt-3 text-sm">
            Since 2019, Verified BM Shop has delivered over <strong>10,000 verified BM accounts</strong> to advertisers in 50+ countries. Our customers include Facebook Ads agencies, e-commerce brands, affiliate marketers, and media buying teams. We accept cryptocurrency payments (USDT, BTC, ETH) for fast, secure transactions. Our <strong>24/7 support team</strong> is always ready to help via WhatsApp, Telegram, or email.
          </p>
        </article>
      </div>

      <div className="mt-10">
        <h3 className="text-xl font-bold text-foreground text-center">Verified BM Features You Get</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
          {[
            { icon: <LayoutGrid className="w-6 h-6 text-primary" aria-hidden="true" />, title: "Multiple Ad Accounts", desc: "Create and manage several ad accounts from one BM." },
            { icon: <MessageSquare className="w-6 h-6 text-primary" aria-hidden="true" />, title: "Meta Live Chat", desc: "Get direct support from Meta's advertising team." },
            { icon: <Target className="w-6 h-6 text-primary" aria-hidden="true" />, title: "Custom Audiences", desc: "Build and target audiences based on your data." },
            { icon: <CheckCircle className="w-6 h-6 text-primary" aria-hidden="true" />, title: "Conversion Tracking", desc: "Set up multiple pixels for precise tracking." },
            { icon: <Share2 className="w-6 h-6 text-primary" aria-hidden="true" />, title: "Asset Sharing", desc: "Share pages, pixels, and accounts between teams." },
            { icon: <UserCog className="w-6 h-6 text-primary" aria-hidden="true" />, title: "Agency Access", desc: "Manage client accounts with full agency features." },
          ].map((f, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-4 text-center">
              <div className="flex justify-center mb-2">{f.icon}</div>
              <h4 className="font-semibold text-foreground text-xs">{f.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default BuyVerifiedBMGuide;
