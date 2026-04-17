import { MapPin, Globe, MessageCircle, Send, Mail, Clock } from "lucide-react";

const contacts = [
  { icon: <Globe className="w-5 h-5 text-primary" aria-hidden="true" />, label: "Online Store", desc: "Shop verified BM accounts 24/7 from anywhere", href: "https://verifiedbm.shop/shop", bg: "bg-primary/10" },
  { icon: <MessageCircle className="w-5 h-5 text-[hsl(142,70%,45%)]" aria-hidden="true" />, label: "WhatsApp Support", desc: "+880 1302 669333 — Chat with our team anytime", href: "https://wa.me/8801302669333", bg: "bg-[hsl(142,70%,45%)]/10" },
  { icon: <Send className="w-5 h-5 text-[hsl(200,100%,40%)]" aria-hidden="true" />, label: "Telegram Channel", desc: "@Verifiedbmbuy — Instant messaging support", href: "https://t.me/Verifiedbmbuy", bg: "bg-[hsl(200,100%,40%)]/10" },
  { icon: <Mail className="w-5 h-5 text-primary" aria-hidden="true" />, label: "Email Us", desc: "info@verifiedbm.shop — Business inquiries", href: "mailto:info@verifiedbm.shop", bg: "bg-primary/10" },
];

const ContactMapSection = () => (
  <section className="py-16 bg-background" aria-label="Contact Verified BM Shop">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold tracking-widest uppercase text-primary text-center">Get in Touch</p>
      <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mt-2">Contact Us Anytime — 24/7 Support</h2>
      <p className="text-muted-foreground text-center mt-4 max-w-2xl mx-auto">
        Verified BM Shop operates as a global digital business from Rangpur, Bangladesh. Reach us through any of the channels below — our support team is available <strong>24 hours a day, 7 days a week</strong>.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
        {/* Left — Address & Availability */}
        <aside className="bg-card border border-border rounded-2xl p-8 flex flex-col">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg">Store Address</h3>
              <address className="text-muted-foreground text-sm mt-1 not-italic">
                Verified BM Shop, 20 Madargonj, Pirgonj, Rangpur, Bangladesh&nbsp;-&nbsp;5470
              </address>
            </div>
          </div>

          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[hsl(142,70%,45%)]/10 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-[hsl(142,70%,45%)]" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg">Available 24/7</h3>
              <p className="text-muted-foreground text-sm mt-1">We're online round the clock — reach out anytime for verified BM purchases or support.</p>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">Serving 10,000+ advertisers across 50+ countries worldwide with verified business solutions.</p>
          </div>
        </aside>

        {/* Right — Contact Channels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {contacts.map((c, i) => (
            <a
              key={i}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-start gap-3 p-5 bg-card border border-border rounded-2xl hover:shadow-lg hover:border-primary/30 transition-all"
              aria-label={`${c.label}: ${c.desc}`}
            >
              <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
                {c.icon}
              </div>
              <div>
                <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{c.label}</p>
                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{c.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default ContactMapSection;
