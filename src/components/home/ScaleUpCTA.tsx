import { Link } from "react-router-dom";
import { TrendingUp, DollarSign, Users, Infinity } from "lucide-react";

const stats = [
  { icon: <TrendingUp className="w-6 h-6 text-primary" aria-hidden="true" />, value: "10x Scaling", desc: "Multiply your ad budget capacity" },
  { icon: <DollarSign className="w-6 h-6 text-primary" aria-hidden="true" />, value: "Lower CPMs", desc: "Better delivery with higher trust" },
  { icon: <Users className="w-6 h-6 text-primary" aria-hidden="true" />, value: "Multi-Client", desc: "Manage multiple brands at once" },
  { icon: <Infinity className="w-6 h-6 text-primary" aria-hidden="true" />, value: "No Spend Cap", desc: "Remove daily spending limits" },
];

const ScaleUpCTA = () => (
  <section className="py-16 bg-secondary/30" aria-label="Scale your e-commerce advertising with verified BM">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold tracking-widest uppercase text-primary text-center">E-Commerce Scaling</p>
      <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mt-2">
        Ready to Scale Your Ad Spend? You Need a Verified BM.
      </h2>
      <p className="text-muted-foreground text-center mt-4 max-w-3xl mx-auto">
        A <strong>verified Business Manager</strong> isn't just a status symbol — it's what lets you actually scale. Higher trust scores mean higher spend limits, more ad accounts, and access to <strong>premium Meta advertising features</strong> that unverified accounts simply don't get.
      </p>
      <p className="text-muted-foreground text-center mt-2 max-w-3xl mx-auto">
        Whether you're an agency juggling dozens of clients or a solo media buyer pushing for better ROI, a verified BM removes the ceiling on your <strong>e-commerce scaling</strong> growth.
      </p>
      <div className="text-center mt-8">
        <Link
          to="/shop"
          className="inline-flex items-center px-8 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          aria-label="Browse all verified BM products and ad accounts"
        >
          Browse Verified Products
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
        {stats.map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-6 text-center hover:shadow-md transition-shadow">
            <div className="flex justify-center mb-3">{s.icon}</div>
            <p className="font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ScaleUpCTA;
