/**
 * Dynamic site configuration.
 * Automatically detects the current domain so all URLs work
 * in development, preview, and production.
 */

export const SITE_NAME = "Verified BM Shop";

/** Production domain — always used for canonical URLs, OG tags, invoices, etc. */
const PRODUCTION_URL = "https://verifiedbm.shop";

/**
 * Returns the canonical site URL.
 * Always returns the production domain so that SEO tags, invoices, and
 * sitemaps never reference preview/staging URLs.
 */
export const getSiteUrl = (): string => {
  return PRODUCTION_URL;
};

export const DEFAULT_DESCRIPTION =
  "Buy verified BM and WhatsApp API from Verified BM Shop. Instant delivery, 7-day guarantee, 24/7 support. Trusted by 10,000+ advertisers.";
