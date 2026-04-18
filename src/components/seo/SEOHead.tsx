import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { SITE_NAME, getSiteUrl, DEFAULT_DESCRIPTION } from "@/lib/config";
import { toBrandedUrl } from "@/lib/imageUtils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranding } from "@/hooks/useBranding";
import { useInternationalSEO } from "@/hooks/useInternationalSEO";

const SEO_SETTINGS_STALE_TIME = 60 * 60 * 1000;

interface SEOHeadProps {
  title?: string;
  description?: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
  keywords?: string;
}

const SEOHead = ({
  title,
  description = DEFAULT_DESCRIPTION,
  ogImage,
  ogType = "website",
  noIndex = false,
  keywords,
}: SEOHeadProps) => {
  const location = useLocation();
  const siteUrl = getSiteUrl();
  const { branding } = useBranding();
  const intlSEO = useInternationalSEO();
  const dynamicSiteName = branding.site_title || SITE_NAME;

  // Build full title, then cap at 60 characters for SEO
  const rawTitle = title ? `${title} | ${dynamicSiteName}` : dynamicSiteName;
  const fullTitle = rawTitle.length > 60 ? rawTitle.slice(0, 57) + "..." : rawTitle;

  // Normalize locale/canonical values to prevent duplicate SEO tags across routes
  const normalizedPath = location.pathname === "/" ? "/" : location.pathname.replace(/\/+$/, "");
  const canonicalUrl = `${siteUrl}${normalizedPath}`;
  const rawLang = (intlSEO.targetLang || "en").trim().replace("_", "-").toLowerCase();
  const lang = rawLang || "en";
  const xDefaultUrl = `${siteUrl}/`;
  const ogRegion = (intlSEO.geoRegion || "US").trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2) || "US";
  const ogLocale = `${lang.split("-")[0]}_${ogRegion}`;

  const defaultOgImage = `${siteUrl}/og-image.webp`;
  const resolvedOgImage = toBrandedUrl(ogImage || defaultOgImage);
  const ogImageType = resolvedOgImage.toLowerCase().includes(".jpg") || resolvedOgImage.toLowerCase().includes(".jpeg")
    ? "image/jpeg"
    : resolvedOgImage.toLowerCase().includes(".png")
      ? "image/png"
      : "image/webp";

  const { data: verification = { googleVerification: "", bingVerification: "" } } = useQuery({
    queryKey: ["seo-verification-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["seo_search_console_tag", "seo_bing_verification_tag"]);

      let googleVerification = "";
      let bingVerification = "";

      data?.forEach((r) => {
        if (r.key === "seo_search_console_tag" && r.value) {
          const match = r.value.match(/content="([^"]+)"/);
          googleVerification = match ? match[1] : r.value;
        }
        if (r.key === "seo_bing_verification_tag" && r.value) {
          bingVerification = r.value;
        }
      });

      return { googleVerification, bingVerification };
    },
    staleTime: SEO_SETTINGS_STALE_TIME,
    gcTime: SEO_SETTINGS_STALE_TIME,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  return (
    <Helmet prioritizeSeoTags>
      <html lang={lang} />
      <title>{fullTitle}</title>
      <meta name="description" content={description.slice(0, 160)} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={noIndex ? "noindex,nofollow" : "index,follow"} />
      <link key="canonical" rel="canonical" href={canonicalUrl} />

      {/* Search engine verification */}
      {verification.googleVerification && <meta key="google-site-verification" name="google-site-verification" content={verification.googleVerification} />}
      {verification.bingVerification && <meta key="bing-site-verification" name="msvalidate.01" content={verification.bingVerification} />}

      <link rel="preconnect" href="https://xukkejkvcgixogvbllmf.supabase.co" crossOrigin="" />
      <link rel="dns-prefetch" href="https://xukkejkvcgixogvbllmf.supabase.co" />
      <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="" />
      <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      <link rel="preconnect" href="https://connect.facebook.net" crossOrigin="" />
      <link rel="dns-prefetch" href="https://connect.facebook.net" />

      {/* Hreflang — single declaration, no duplicates */}
      <link key={`alternate-${lang}`} rel="alternate" hrefLang={lang} href={canonicalUrl} />
      <link key="alternate-x-default" rel="alternate" hrefLang="x-default" href={xDefaultUrl} />
      <meta key="meta-language" name="language" content={lang} />

      {/* Geo targeting */}
      {intlSEO.geoRegion && <meta name="geo.region" content={intlSEO.geoRegion} />}
      {intlSEO.geoPlacename && <meta name="geo.placename" content={intlSEO.geoPlacename} />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description.slice(0, 160)} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={resolvedOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:type" content={ogImageType} />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:site_name" content={dynamicSiteName} />
      <meta property="og:locale" content={ogLocale} />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@VerifiedBMStore" />
      <meta name="twitter:creator" content="@VerifiedBMStore" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description.slice(0, 160)} />
      <meta name="twitter:image" content={resolvedOgImage} />
      <meta name="twitter:image:alt" content={fullTitle} />

      {/* Pinterest */}
      <meta property="pin:media" content={resolvedOgImage} />
      <meta property="pin:description" content={description.slice(0, 160)} />

      {/* Dynamic favicon */}
      {branding.favicon && <link rel="icon" href={branding.favicon} />}
    </Helmet>
  );
};

export default SEOHead;
