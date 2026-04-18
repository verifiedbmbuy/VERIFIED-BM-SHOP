/**
 * JsonLdSchema — Injects JSON-LD structured data into <head>.
 * Respects admin toggles from site_settings.schema_config.
 */

import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { useSchemaConfig } from "@/hooks/useSchemaConfig";
import { useBranding } from "@/hooks/useBranding";
import { supabase } from "@/integrations/supabase/client";
import {
  combineSchemas,
  generateOrganization,
  generateLocalBusiness,
  generateWebSite,
  generateWebPage,
  generateBreadcrumbs,
  generateProduct,
  generateArticle,
  generateFAQPage,
  generateReadAction,
  generateService,
  type BrandingData,
} from "@/lib/jsonLdSchemas";
import { getSiteUrl } from "@/lib/config";
import { useLocation } from "react-router-dom";

const CUSTOM_JSON_LD_STALE_TIME = 60 * 60 * 1000;

interface JsonLdSchemaProps {
  pageTitle?: string;
  pageDescription?: string;
  pageImage?: string;
  datePublished?: string;
  dateModified?: string;
  breadcrumbs?: { name: string; url: string }[];
  product?: any;
  article?: any;
  faqs?: { question: string; answer: string }[];
  /** Custom JSON-LD script from admin settings */
  customJsonLd?: string;
}

const JsonLdSchema = ({
  pageTitle,
  pageDescription,
  pageImage,
  datePublished,
  dateModified,
  breadcrumbs,
  product,
  article,
  faqs,
  customJsonLd,
}: JsonLdSchemaProps) => {
  const { config, loading } = useSchemaConfig();
  const { branding } = useBranding();
  const location = useLocation();
  const siteUrl = getSiteUrl();
  const { data: adminCustomJsonLd } = useQuery({
    queryKey: ["custom-json-ld"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_setting", { setting_key: "custom_json_ld" });
      return data || null;
    },
    staleTime: CUSTOM_JSON_LD_STALE_TIME,
    gcTime: CUSTOM_JSON_LD_STALE_TIME,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  if (loading) return null;

  const brandingData: BrandingData = {
    header_logo: branding.header_logo,
    site_title: branding.site_title,
  };

  const schemas: any[] = [];

  // 1. Organization (global)
  if (config.organization) {
    schemas.push(generateOrganization(brandingData));
    // Service schema for rich snippets
    schemas.push(generateService(brandingData));
  }

  // 2. LocalBusiness (global, if enabled)
  if (config.localBusiness) {
    schemas.push(generateLocalBusiness(brandingData));
  }

  // 3. WebSite + SearchAction (global)
  if (config.website) {
    schemas.push(generateWebSite(brandingData));
  }

  // 4. WebPage (every page)
  if (config.webPage && pageTitle) {
    schemas.push(
      generateWebPage({
        title: pageTitle,
        description: pageDescription || "",
        url: `${siteUrl}${location.pathname}`,
        image: pageImage,
        datePublished,
        dateModified,
      })
    );
  }

  // 5. BreadcrumbList
  if (config.breadcrumbList) {
    const crumbs = breadcrumbs || autoBreadcrumbs(location.pathname);
    if (crumbs.length > 0) {
      schemas.push(generateBreadcrumbs(crumbs));
    }
  }

  // 6. Product + Offer
  if (config.product && product) {
    schemas.push(generateProduct(product, brandingData));
  }

  // 7. Article
  if (config.article && article) {
    schemas.push(generateArticle(article, brandingData));
  }

  // 8. FAQPage
  if (config.faqPage && faqs && faqs.length > 0) {
    schemas.push(generateFAQPage(faqs));
  }

  // 9. ReadAction for search/interaction points
  if (config.readAction) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "ReadAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
        actionPlatform: [
          "https://schema.org/DesktopWebPlatform",
          "https://schema.org/MobileWebPlatform",
        ],
      },
      name: "Search Verified BM Shop",
      "query-input": {
        "@type": "PropertyValueSpecification",
        valueRequired: true,
        valueName: "search_term_string",
      },
    });
  }

  const combined = combineSchemas(...schemas);

  // Parse custom JSON-LD from admin settings or prop
  const rawCustom = adminCustomJsonLd || customJsonLd;
  let customScript: string | null = null;
  if (rawCustom) {
    try {
      JSON.parse(rawCustom);
      customScript = rawCustom;
    } catch {
      // invalid JSON, skip
    }
  }

  if (!combined && !customScript) return null;

  return (
    <Helmet>
      {combined && (
        <script type="application/ld+json">
          {JSON.stringify(combined)}
        </script>
      )}
      {customScript && (
        <script type="application/ld+json">
          {customScript}
        </script>
      )}
    </Helmet>
  );
};

/** Auto-generate breadcrumbs from URL path */
function autoBreadcrumbs(pathname: string): { name: string; url: string }[] {
  const items: { name: string; url: string }[] = [{ name: "Home", url: "/" }];
  const parts = pathname.split("/").filter(Boolean);

  let path = "";
  for (const part of parts) {
    path += `/${part}`;
    const name = part
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    items.push({ name, url: path });
  }

  return items;
}

export default JsonLdSchema;
