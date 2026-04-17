import { Shield, TrendingUp, Users, Unlock, Globe, Clock, DollarSign, Lock, BarChart3, Target, Share2, Ban, MessageSquare, Bot, Eye, ShieldCheck, Smartphone, Users2, Bell, Inbox, BadgeCheck, FileText, Headphones, ImageIcon } from "lucide-react";

const verifiedBMBenefits = [
  { icon: <Shield className="w-6 h-6 text-primary" aria-hidden="true" />, title: "Higher Trust Score", desc: "Verified BMs earn Meta's highest trust level — far less likely to get flagged or banned during ad campaigns." },
  { icon: <TrendingUp className="w-6 h-6 text-primary" aria-hidden="true" />, title: "Better Ad Performance", desc: "Higher trust translates to better ad delivery, lower CPMs, and improved return on ad spend (ROAS)." },
  { icon: <Users className="w-6 h-6 text-primary" aria-hidden="true" />, title: "Multiple Ad Accounts", desc: "One verified BM lets you manage several ad accounts — ideal for testing creatives or running client campaigns at scale." },
  { icon: <Unlock className="w-6 h-6 text-primary" aria-hidden="true" />, title: "Unlock Premium Meta Tools", desc: "Access advanced advertising features, APIs, and analytics unavailable to unverified accounts." },
  { icon: <Globe className="w-6 h-6 text-primary" aria-hidden="true" />, title: "Advertise Globally", desc: "No geographic restrictions. Run Meta advertising campaigns in any market worldwide." },
  { icon: <Clock className="w-6 h-6 text-primary" aria-hidden="true" />, title: "Faster Ad Approvals", desc: "Meta reviews and approves ads faster for verified business accounts, reducing time-to-market." },
  { icon: <DollarSign className="w-6 h-6 text-primary" aria-hidden="true" />, title: "Higher Spend Limits", desc: "Verified accounts unlock significantly higher daily and lifetime spending limits for e-commerce scaling." },
  { icon: <Lock className="w-6 h-6 text-primary" aria-hidden="true" />, title: "Enterprise-Grade Security", desc: "Two-factor authentication and admin controls keep your ad accounts and business data protected." },
  { icon: <BarChart3 className="w-6 h-6 text-primary" aria-hidden="true" />, title: "Advanced Analytics", desc: "Access deeper reporting tools for granular campaign performance insights and data-driven decisions." },
  { icon: <Target className="w-6 h-6 text-primary" aria-hidden="true" />, title: "Multiple Tracking Pixels", desc: "Set up and manage several pixels for precise audience tracking, retargeting, and conversion measurement." },
  { icon: <Share2 className="w-6 h-6 text-primary" aria-hidden="true" />, title: "Seamless Asset Sharing", desc: "Share pages, pixels, and ad accounts between agencies and clients without friction or delays." },
  { icon: <Ban className="w-6 h-6 text-primary" aria-hidden="true" />, title: "Fewer Account Restrictions", desc: "Verified accounts experience far fewer random bans and limitations from Meta's enforcement systems." },
];

const whatsappBenefits = [
  { icon: <MessageSquare className="w-6 h-6 text-primary" aria-hidden="true" />, title: "Bulk Messaging at Scale", desc: "Send thousands of messages, order updates, and promotional campaigns from one dashboard." },
  { icon: <Bot className="w-6 h-6 text-primary" aria-hidden="true" />, title: "AI Chatbot Integration", desc: "Connect AI-powered chatbots to handle customer queries automatically, 24/7." },
  { icon: <Eye className="w-6 h-6 text-primary" aria-hidden="true" />, title: "Full Campaign Analytics", desc: "Track opens, replies, click-through rates, and measure how your messaging campaigns perform." },
  { icon: <ShieldCheck className="w-6 h-6 text-primary" aria-hidden="true" />, title: "End-to-End Encryption", desc: "WhatsApp's built-in encryption keeps every business conversation private and secure." },
  { icon: <Smartphone className="w-6 h-6 text-primary" aria-hidden="true" />, title: "Multi-Device Access", desc: "Your entire team can manage conversations from different devices simultaneously." },
  { icon: <Users2 className="w-6 h-6 text-primary" aria-hidden="true" />, title: "Reach 2B+ Users", desc: "WhatsApp is used in 180+ countries. Your customers are already there — meet them where they are." },
  { icon: <Bell className="w-6 h-6 text-primary" aria-hidden="true" />, title: "Real-Time Notifications", desc: "Send instant order confirmations, shipping updates, and payment receipts automatically." },
  { icon: <Inbox className="w-6 h-6 text-primary" aria-hidden="true" />, title: "Shared Team Inbox", desc: "Assign chats to team members with routing rules so no customer message falls through the cracks." },
  { icon: <BadgeCheck className="w-6 h-6 text-primary" aria-hidden="true" />, title: "Green Badge Verification", desc: "Get the official green checkmark that tells customers your business is verified and trustworthy." },
  { icon: <FileText className="w-6 h-6 text-primary" aria-hidden="true" />, title: "Pre-Approved Templates", desc: "Use Meta-approved message templates for consistent, compliant outreach at enterprise scale." },
  { icon: <Headphones className="w-6 h-6 text-primary" aria-hidden="true" />, title: "Hybrid Support Flows", desc: "Combine automated chatbot flows with live agent handoffs for round-the-clock customer care." },
  { icon: <ImageIcon className="w-6 h-6 text-primary" aria-hidden="true" />, title: "Rich Media Messaging", desc: "Send images, videos, documents, and interactive buttons — not just plain text messages." },
];

const BenefitsGrid = ({ type }: { type: "bm" | "whatsapp" }) => {
  const isBM = type === "bm";
  const benefits = isBM ? verifiedBMBenefits : whatsappBenefits;

  return (
    <section
      className="pt-16 pb-8 bg-background"
      aria-label={isBM ? "Benefits of verified Business Manager accounts" : "Benefits of WhatsApp Business API"}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold tracking-widest uppercase text-primary text-center">
          {isBM ? "Why Verified BM?" : "WhatsApp API"}
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mt-2">
          {isBM ? "Why Smart Advertisers Use Verified BMs" : "Why Businesses Need WhatsApp Business API"}
        </h2>
        <p className="text-muted-foreground text-center mt-4 max-w-2xl mx-auto">
          {isBM
            ? "If you're serious about Meta advertising, a verified Business Manager isn't optional — it's the foundation for scaling profitably."
            : "Your customers are on WhatsApp. Meet them where they already are with enterprise-grade messaging."}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-10">
          {benefits.map((b, i) => (
            <article key={i} className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">{b.icon}</div>
              <h3 className="font-bold text-foreground">{b.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{b.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsGrid;
