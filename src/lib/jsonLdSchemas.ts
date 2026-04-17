/**
 * Comprehensive JSON-LD Schema Markup Generator
 * Covers all 28 required schema types mapped to the database structure.
 */

import { getSiteUrl, SITE_NAME, DEFAULT_DESCRIPTION } from "@/lib/config";
import { toBrandedUrl } from "@/lib/imageUtils";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SchemaConfig {
  // Core Identity
  organization: boolean;
  localBusiness: boolean;
  // Site Structure
  website: boolean;
  webPage: boolean;
  breadcrumbList: boolean;
  // E-commerce
  product: boolean;
  offer: boolean;
  // Content
  article: boolean;
  faqPage: boolean;
  // Events (optional)
  event: boolean;
  // Actions
  readAction: boolean;
}

export const DEFAULT_SCHEMA_CONFIG: SchemaConfig = {
  organization: true,
  localBusiness: true,
  website: true,
  webPage: true,
  breadcrumbList: true,
  product: true,
  offer: true,
  article: true,
  faqPage: true,
  event: false,
  readAction: true,
};

export interface BrandingData {
  header_logo: string;
  site_title: string;
}

export interface BusinessInfo {
  name: string;
  description: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  geo?: { lat: number; lng: number };
  openingHours?: string[];
  socialLinks?: string[];
}

const DEFAULT_BUSINESS: BusinessInfo = {
  name: "Verified BM Shop",
  description: DEFAULT_DESCRIPTION,
  email: "info@verifiedbm.shop",
  phone: "+8801302669333",
  address: {
    street: "Madergonj, Pirgonj",
    city: "Rangpur",
    region: "Rangpur Division",
    postalCode: "5470",
    country: "BD",
  },
  geo: { lat: 25.7868, lng: 89.3730 },
  openingHours: ["Mo-Su 00:00-23:59"],
  socialLinks: [
    "https://wa.me/8801302669333",
    "https://t.me/Verifiedbmbuy",
    "https://facebook.com/101736778209833",
  ],
};

// ─── Schema Generators ──────────────────────────────────────────────────────

/** 1. Organization + Logo */
export function generateOrganization(branding: BrandingData, biz: BusinessInfo = DEFAULT_BUSINESS) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: branding.site_title || biz.name,
    url: siteUrl,
    logo: branding.header_logo
      ? { "@type": "ImageObject", url: branding.header_logo, width: 200, height: 60 }
      : undefined,
    description: biz.description,
    email: biz.email,
    telephone: biz.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: biz.address.street,
      addressLocality: biz.address.city,
      addressRegion: biz.address.region,
      postalCode: biz.address.postalCode,
      addressCountry: biz.address.country,
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: biz.phone,
      contactType: "customer support",
      availableLanguage: ["English"],
      areaServed: "Worldwide",
    },
    sameAs: biz.socialLinks || [],
  };
}

/** 2. LocalBusiness (extends Organization) */
export function generateLocalBusiness(branding: BrandingData, biz: BusinessInfo = DEFAULT_BUSINESS) {
  const siteUrl = getSiteUrl();
  const org = generateOrganization(branding, biz);
  return {
    ...org,
    "@type": "LocalBusiness",
    geo: biz.geo
      ? { "@type": "GeoCoordinates", latitude: biz.geo.lat, longitude: biz.geo.lng }
      : undefined,
    openingHoursSpecification: (biz.openingHours || []).map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.split(" ")[0],
      opens: h.split(" ")[1]?.split("-")[0] || "00:00",
      closes: h.split(" ")[1]?.split("-")[1] || "23:59",
    })),
    priceRange: "$$",
  };
}

/** 3. Person (site owner / author) */
export function generatePerson(name: string, url?: string) {
  return {
    "@type": "Person",
    name,
    url: url || getSiteUrl(),
  };
}

/** 4. WebSite + SearchAction (Sitelinks Searchbox) */
export function generateWebSite(branding: BrandingData) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: branding.site_title || SITE_NAME,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** 5. WebPage */
export function generateWebPage(opts: {
  title: string;
  description: string;
  url: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: opts.title,
    description: opts.description,
    url: opts.url,
    image: opts.image
      ? { "@type": "ImageObject", url: toBrandedUrl(opts.image) }
      : undefined,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified,
    isPartOf: { "@type": "WebSite", url: getSiteUrl() },
  };
}

/** 6. BreadcrumbList */
export function generateBreadcrumbs(items: { name: string; url: string }[]) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${siteUrl}${item.url}`,
    })),
  };
}

/** 7. ImageObject (with full SEO metadata) */
export function generateImageObject(
  url: string,
  caption?: string,
  width?: number,
  height?: number,
  altText?: string,
  description?: string,
) {
  return {
    "@type": "ImageObject",
    url,
    caption: caption || undefined,
    description: description || undefined,
    name: altText || undefined,
    width: width || undefined,
    height: height || undefined,
    contentUrl: url,
  };
}

/** 8. Product + Offer */
export function generateProduct(product: {
  title: string;
  description: string;
  slug: string;
  image_url?: string;
  gallery_images?: string[];
  price: number;
  sale_price?: number | null;
  sku?: string;
  stock_status: string;
  rating?: number;
  category?: string;
  /** Optional rich image metadata from media_files */
  imageMetadata?: Array<{
    url: string;
    alt_text?: string;
    caption?: string;
    description?: string;
    width?: number;
    height?: number;
  }>;
}, branding: BrandingData) {
  const siteUrl = getSiteUrl();
  const rawImages = [product.image_url, ...(product.gallery_images || [])].filter(Boolean);

  // Use rich metadata if available, otherwise fall back to basic ImageObject
  const images = product.imageMetadata && product.imageMetadata.length > 0
    ? product.imageMetadata.map((img) =>
        generateImageObject(toBrandedUrl(img.url), img.caption, img.width, img.height, img.alt_text, img.description)
      )
    : rawImages.map((url) => ({ "@type": "ImageObject" as const, url: toBrandedUrl(url) }));

  const inStock = product.stock_status === "in_stock";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: images,
    sku: product.sku || undefined,
    category: product.category,
    brand: {
      "@type": "Brand",
      name: branding.site_title || SITE_NAME,
    },
    offers: {
      "@type": "Offer",
      price: product.sale_price || product.price,
      priceCurrency: "USD",
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${siteUrl}/product/${product.slug}`,
      seller: {
        "@type": "Organization",
        name: branding.site_title || SITE_NAME,
      },
    },
    aggregateRating: product.rating
      ? {
          "@type": "AggregateRating",
          ratingValue: product.rating,
          bestRating: 5,
          ratingCount: 1,
        }
      : undefined,
  };
}

/** 9. FAQPage + Question + Answer */
export function generateFAQPage(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/** 10. Article + Author + Publisher */
export function generateArticle(post: {
  title: string;
  slug: string;
  excerpt?: string;
  meta_description?: string;
  featured_image?: string;
  author: string;
  published_at?: string;
  created_at: string;
  content?: string;
}, branding: BrandingData) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.meta_description || post.excerpt || "",
    image: post.featured_image
      ? { "@type": "ImageObject", url: toBrandedUrl(post.featured_image) }
      : undefined,
    author: {
      "@type": "Person",
      name: post.author || "Admin",
    },
    publisher: {
      "@type": "Organization",
      name: branding.site_title || SITE_NAME,
      logo: branding.header_logo
        ? { "@type": "ImageObject", url: branding.header_logo }
        : undefined,
    },
    datePublished: post.published_at || post.created_at,
    dateModified: post.created_at,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/blog/${post.slug}`,
    },
  };
}

/** 11. VideoObject (for embedded videos in posts) */
export function generateVideoObject(opts: {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  contentUrl?: string;
  embedUrl?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: opts.name,
    description: opts.description,
    thumbnailUrl: opts.thumbnailUrl,
    uploadDate: opts.uploadDate,
    contentUrl: opts.contentUrl,
    embedUrl: opts.embedUrl,
  };
}

/** 12. Event + Place + Organizer (optional template) */
export function generateEvent(opts: {
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  location?: string;
  url?: string;
  image?: string;
  organizerName?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: opts.name,
    description: opts.description,
    startDate: opts.startDate,
    endDate: opts.endDate,
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: opts.location
      ? { "@type": "Place", name: opts.location }
      : { "@type": "VirtualLocation", url: opts.url || getSiteUrl() },
    organizer: {
      "@type": "Organization",
      name: opts.organizerName || SITE_NAME,
      url: getSiteUrl(),
    },
    image: opts.image
      ? { "@type": "ImageObject", url: opts.image }
      : undefined,
  };
}

/** 13. ReadAction + PropertyValueSpecification (CTA intent) */
export function generateReadAction(targetUrl: string, name: string) {
  return {
    "@type": "ReadAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: targetUrl,
      actionPlatform: [
        "https://schema.org/DesktopWebPlatform",
        "https://schema.org/MobileWebPlatform",
      ],
    },
    name,
  };
}

/** Combine multiple schemas into a single @graph for the <head> */
export function combineSchemas(...schemas: any[]) {
  const filtered = schemas.filter(Boolean);
  if (filtered.length === 0) return null;
  if (filtered.length === 1) return filtered[0];
  return {
    "@context": "https://schema.org",
    "@graph": filtered.map((s) => {
      const { "@context": _, ...rest } = s;
      return rest;
    }),
  };
}

/** Service schema for rich snippets */
export function generateService(branding: BrandingData, biz: BusinessInfo = DEFAULT_BUSINESS) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Verified Business Manager Solutions",
    description: DEFAULT_DESCRIPTION,
    provider: {
      "@type": "Organization",
      name: branding.site_title || biz.name,
      url: siteUrl,
      logo: branding.header_logo
        ? { "@type": "ImageObject", url: branding.header_logo }
        : undefined,
    },
    serviceType: "Digital Marketing Services",
    areaServed: "Worldwide",
    url: siteUrl,
  };
}
