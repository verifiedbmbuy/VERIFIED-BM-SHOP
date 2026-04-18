import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const TRACKING_CACHE_KEY = "tracking_settings_cache_v1";
const TRACKING_CACHE_TTL = 60 * 60 * 1000;

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    fbq: (...args: unknown[]) => void;
    gtag: (...args: unknown[]) => void;
  }
}

const isProduction = () => {
  const hostname = window.location.hostname;
  return (
    !hostname.includes("localhost") &&
    !hostname.includes("lovable.app") &&
    !hostname.includes("lovableproject.com") &&
    !hostname.includes("127.0.0.1")
  );
};

const injectScript = (content: string, target: "head" | "body") => {
  const container = document.createElement("div");
  container.innerHTML = content;
  const scripts = container.querySelectorAll("script");
  const parent = target === "head" ? document.head : document.body;

  scripts.forEach((origScript) => {
    const script = document.createElement("script");
    Array.from(origScript.attributes).forEach((attr) => {
      script.setAttribute(attr.name, attr.value);
    });
    script.textContent = origScript.textContent;
    script.setAttribute("data-tracking", "custom");
    parent.appendChild(script);
  });

  const nonScripts = container.querySelectorAll(":not(script)");
  nonScripts.forEach((el) => {
    const clone = el.cloneNode(true) as HTMLElement;
    clone.setAttribute("data-tracking", "custom");
    parent.appendChild(clone);
  });
};

/* ── Standard event helpers (call from components) ── */

export const trackEvent = (eventName: string, params?: Record<string, unknown>) => {
  if (typeof window.fbq === "function") {
    window.fbq("track", eventName, params);
  }
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: eventName, ...params });
};

export const trackAddToCart = (product: { id: string; title: string; price: number; currency?: string }) => {
  trackEvent("AddToCart", {
    content_ids: [product.id],
    content_name: product.title,
    content_type: "product",
    value: product.price,
    currency: product.currency || "USD",
  });
};

export const trackPurchase = (order: { id: string; total: number; currency?: string; items?: { id: string; title: string; price: number; qty: number }[] }) => {
  trackEvent("Purchase", {
    content_ids: order.items?.map((i) => i.id) || [],
    content_type: "product",
    value: order.total,
    currency: order.currency || "USD",
    order_id: order.id,
    num_items: order.items?.length || 0,
  });
};

export const trackViewContent = (product: { id: string; title: string; price: number; currency?: string; category?: string }) => {
  trackEvent("ViewContent", {
    content_ids: [product.id],
    content_name: product.title,
    content_category: product.category,
    content_type: "product",
    value: product.price,
    currency: product.currency || "USD",
  });
};

const TrackingScripts = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return;
    if (!isProduction()) return;

    // Initialize dataLayer early
    window.dataLayer = window.dataLayer || [];

    const load = async () => {
      let data: Array<{ key: string; value: string }> | null = null;

      try {
        const cached = window.sessionStorage.getItem(TRACKING_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as { timestamp: number; data: Array<{ key: string; value: string }> };
          if (Date.now() - parsed.timestamp < TRACKING_CACHE_TTL) {
            data = parsed.data;
          }
        }
      } catch {
        // Ignore malformed cache and refetch.
      }

      if (!data) {
        const response = await supabase
          .from("site_settings")
          .select("key, value")
          .like("key", "tracking_%");

        data = response.data as Array<{ key: string; value: string }> | null;

        if (data) {
          try {
            window.sessionStorage.setItem(TRACKING_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
          } catch {
            // Ignore cache write failures.
          }
        }
      }

      if (!data || data.length === 0) return;

      const settings: Record<string, string> = {};
      data.forEach((r) => { settings[r.key] = r.value; });

      // GA4
      if (settings.tracking_ga4_id) {
        const script = document.createElement("script");
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${settings.tracking_ga4_id}`;
        script.setAttribute("data-tracking", "ga4");
        document.head.appendChild(script);

        const inline = document.createElement("script");
        inline.setAttribute("data-tracking", "ga4-config");
        inline.textContent = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${settings.tracking_ga4_id}');
        `;
        document.head.appendChild(inline);
      }

      // GTM head + noscript body fallback
      if (settings.tracking_gtm_id) {
        const script = document.createElement("script");
        script.setAttribute("data-tracking", "gtm");
        script.textContent = `
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${settings.tracking_gtm_id}');
        `;
        document.head.appendChild(script);

        // GTM noscript fallback
        const noscript = document.createElement("noscript");
        noscript.setAttribute("data-tracking", "gtm-noscript");
        const iframe = document.createElement("iframe");
        iframe.src = `https://www.googletagmanager.com/ns.html?id=${settings.tracking_gtm_id}`;
        iframe.height = "0";
        iframe.width = "0";
        iframe.style.display = "none";
        iframe.style.visibility = "hidden";
        noscript.appendChild(iframe);
        document.body.insertBefore(noscript, document.body.firstChild);
      }

      // Google Ads
      if (settings.tracking_google_ads_id) {
        const inline = document.createElement("script");
        inline.setAttribute("data-tracking", "gads");
        inline.textContent = `gtag('config', '${settings.tracking_google_ads_id}');`;
        document.head.appendChild(inline);
      }

      // Facebook Pixel with PageView
      if (settings.tracking_fb_pixel_id) {
        const script = document.createElement("script");
        script.setAttribute("data-tracking", "fbpixel");
        script.textContent = `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${settings.tracking_fb_pixel_id}');
          fbq('track', 'PageView');
        `;
        document.head.appendChild(script);
      }

      if (settings.tracking_header_scripts) {
        injectScript(settings.tracking_header_scripts, "head");
      }
      if (settings.tracking_footer_scripts) {
        injectScript(settings.tracking_footer_scripts, "body");
      }

      setLoaded(true);
    };

    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(load, { timeout: 4000 });
    } else {
      setTimeout(load, 2500);
    }
  }, [loaded]);

  return null;
};

export default TrackingScripts;
