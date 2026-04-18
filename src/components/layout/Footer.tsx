import { useMemo } from "react";
import { Link } from "react-router-dom";
import { MapPin, MessageCircle, Send, Mail, ChevronRight } from "lucide-react";
import NewsletterForm from "@/components/newsletter/NewsletterForm";
import { useBranding } from "@/hooks/useBranding";
import { useMenuItems } from "@/hooks/useMenuItems";
import EditableText from "@/components/editor/EditableText";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DynamicIcon from "@/components/shared/DynamicIcon";
import { toBrandedUrl } from "@/lib/imageUtils";

const FOOTER_SETTINGS_STALE_TIME = 30 * 60 * 1000;

const FOOTER_KEYS = [
  "footer_description", "contact_address", "contact_phone",
  "contact_telegram", "contact_email", "footer_copyright_text",
  "footer_newsletter_title", "footer_newsletter_description",
];

const Footer = () => {
  const { branding } = useBranding();
  const { data: dbQuickLinks } = useMenuItems("footer-quick");
  const { data: dbTrustLinks } = useMenuItems("footer-trust");
  const { data: footerSettings = {} } = useQuery({
    queryKey: ["footer-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("key, value").in("key", FOOTER_KEYS);
      const map: Record<string, string> = {};
      data?.forEach((r) => { map[r.key] = r.value; });
      return map;
    },
    staleTime: FOOTER_SETTINGS_STALE_TIME,
    gcTime: FOOTER_SETTINGS_STALE_TIME,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const desc = footerSettings.footer_description || "Okey! Trusted provider of verified Meta Business Managers and WhatsApp Business API accounts since 2020. Serving 10,000+ advertisers globally. We offer premium, fully verified BMs with high spending limits, dedicated support, and a hassle-free replacement guarantee — helping agencies and media buyers scale their ad campaigns with confidence.";
  const address = footerSettings.contact_address || "20 Madargonj, Pirgonj, Rangpur, Bangladesh\u00a0-\u00a05470";
  const phone = footerSettings.contact_phone || "+8801302669333";
  const telegram = footerSettings.contact_telegram || "Verifiedbmbuy";
  const email = footerSettings.contact_email || "info@verifiedbm.shop";
  const copyrightRaw = footerSettings.footer_copyright_text || `© {year} ${branding.site_title || "Verified BM Shop"}. All rights reserved. | Verified BM & WhatsApp API Provider`;
  const copyright = copyrightRaw.replace(/\{year\}/g, String(new Date().getFullYear()));
  const fallbackLogo = "/images/logos/Verified-bm-shop-logo.png";
  const footerLogoSrc = fallbackLogo;

  const logoElement = (
    <img
      src={footerLogoSrc}
      alt={`${branding.site_title || "Verified BM Shop"} logo`}
      className="h-11 max-w-[200px] object-contain"
      loading="lazy"
      onError={(e) => {
        const img = e.currentTarget;
        if (img.src !== fallbackLogo) {
          img.src = fallbackLogo;
        }
      }}
    />
  );

  const fallbackLogoElement = (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm shadow-sm">V</div>
      <span className="text-lg font-bold text-foreground tracking-tight">Verified BM <span className="text-primary">Shop</span></span>
    </div>
  );

  const defaultQuickLinks = [
    { to: "/shop", label: "All Products" },
    { to: "/blog", label: "All Post" },
    { to: "/about", label: "About Us" },
    { to: "/contact", label: "Contact & Support" },
    { to: "/faq", label: "FAQ" },
  ];
  const defaultTrustLinks = [
    { to: "/terms", label: "Terms of Service" },
    { to: "/privacy", label: "Privacy Policy" },
    { to: "/refund-policy", label: "Refund Policy" },
    { to: "/replacement-guarantee", label: "Replacement Guarantee" },
    { to: "/faq", label: "FAQ" },
  ];

  const quickLinks = useMemo(() => (
    dbQuickLinks && dbQuickLinks.length > 0
      ? dbQuickLinks.map(m => ({ to: m.url, label: m.label, iconName: m.icon_name }))
      : defaultQuickLinks.map(l => ({ ...l, iconName: null as string | null }))
  ), [dbQuickLinks]);
  const trustLinks = useMemo(() => (
    dbTrustLinks && dbTrustLinks.length > 0
      ? dbTrustLinks.map(m => ({ to: m.url, label: m.label, iconName: m.icon_name }))
      : defaultTrustLinks.map(l => ({ ...l, iconName: null as string | null }))
  ), [dbTrustLinks]);

  return (
    <footer className="relative bg-gradient-to-b from-secondary/30 via-secondary/50 to-secondary/70 border-t border-border print:hidden">
      {/* Newsletter Band */}
      <div className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="max-w-xl mx-auto text-center">
            <EditableText
              fieldKey="setting:footer_newsletter_title"
              value={footerSettings.footer_newsletter_title || ""}
              fallback="Join our Newsletter"
              as="h3"
              className="text-lg font-bold text-foreground mb-1"
            />
            <EditableText
              fieldKey="setting:footer_newsletter_description"
              value={footerSettings.footer_newsletter_description || ""}
              fallback="Get exclusive deals, tips & updates delivered to your inbox weekly."
              as="p"
              className="text-sm text-muted-foreground mb-4"
            />
            <NewsletterForm variant="footer" />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 items-start">

          {/* Col 1 — Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="mb-4">{footerLogoSrc ? logoElement : fallbackLogoElement}</div>
            <EditableText
              fieldKey="setting:footer_description"
              value={footerSettings.footer_description || ""}
              fallback={desc}
              as="p"
              className="text-sm text-muted-foreground leading-relaxed"
            />
          </div>

          {/* Col 2 — Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-foreground uppercase tracking-[0.15em] mb-5 flex items-center gap-2">
              <span className="w-6 h-px bg-primary/60 rounded-full" />
              Quick Links
            </h4>
            <ul className="space-y-0.5">
              {quickLinks.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="group flex items-center gap-2 text-sm text-muted-foreground py-1.5 hover:text-primary transition-colors"
                  >
                    {l.iconName ? (
                      <DynamicIcon name={l.iconName} className="w-4 h-4 shrink-0 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    )}
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Trust Center */}
          <div>
            <h4 className="text-xs font-bold text-foreground uppercase tracking-[0.15em] mb-5 flex items-center gap-2">
              <span className="w-6 h-px bg-primary/60 rounded-full" />
              Trust Center
            </h4>
            <ul className="space-y-0.5">
              {trustLinks.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="group flex items-center gap-2 text-sm text-muted-foreground py-1.5 hover:text-primary transition-colors"
                  >
                    {l.iconName ? (
                      <DynamicIcon name={l.iconName} className="w-4 h-4 shrink-0 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    )}
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Contact */}
          <div>
            <h4 className="text-xs font-bold text-foreground uppercase tracking-[0.15em] mb-5 flex items-center gap-2">
              <span className="w-6 h-px bg-primary/60 rounded-full" />
              Contact Us
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <EditableText
                  fieldKey="setting:contact_address"
                  value={footerSettings.contact_address || ""}
                  fallback={address}
                  as="span"
                  className="leading-relaxed"
                />
              </div>

              <a href={`https://wa.me/${phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer"
                aria-label={`Chat with ${branding.site_title || "Verified BM Shop"} on WhatsApp`}
                className="group flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <div className="w-8 h-8 rounded-lg bg-[hsl(142,70%,45%)]/10 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4 h-4 text-[hsl(142,70%,45%)]" />
                </div>
                <EditableText
                  fieldKey="setting:contact_phone"
                  value={footerSettings.contact_phone || ""}
                  fallback={phone}
                  as="span"
                />
              </a>

              <a href={`https://t.me/${telegram}`} target="_blank" rel="noopener noreferrer"
                aria-label={`Message ${branding.site_title || "Verified BM Shop"} on Telegram`}
                className="group flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <div className="w-8 h-8 rounded-lg bg-[hsl(200,100%,40%)]/10 flex items-center justify-center shrink-0">
                  <Send className="w-4 h-4 text-[hsl(200,100%,40%)]" />
                </div>
                <EditableText
                  fieldKey="setting:contact_telegram"
                  value={footerSettings.contact_telegram || ""}
                  fallback={telegram}
                  as="span"
                />
              </a>

              <a href={`mailto:${email}`}
                aria-label={`Email ${branding.site_title || "Verified BM Shop"}`}
                className="group flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <EditableText
                  fieldKey="setting:contact_email"
                  value={footerSettings.contact_email || ""}
                  fallback={email}
                  as="span"
                />
              </a>

            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 text-center text-xs text-muted-foreground">
          <EditableText
            fieldKey="setting:footer_copyright_text"
            value={footerSettings.footer_copyright_text ? footerSettings.footer_copyright_text.replace(/\{year\}/g, String(new Date().getFullYear())) : ""}
            fallback={copyright}
            as="span"
          />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
