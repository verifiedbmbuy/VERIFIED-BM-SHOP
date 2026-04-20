const PRODUCTION_SITE_URL = (import.meta.env.VITE_SITE_URL || "https://verifiedbm.shop").replace(/\/+$/, "");

const resolveSiteUrl = (): string => {
  if (typeof window === "undefined") return PRODUCTION_SITE_URL;
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return window.location.origin.replace(/\/+$/, "");
  }
  return PRODUCTION_SITE_URL;
};

const SITE_URL = resolveSiteUrl();
const LOCAL_IMAGES_PREFIX = `${SITE_URL}/images/`;

const LEGACY_BRANDING_ASSET_MAP: Record<string, string> = {
  "/images/logos/header_logo.webp": "/images/logos/Verified-bm-shop-logo.png",
  "/images/logos/footer_logo.webp": "/images/logos/Verified-bm-shop-logo.png",
  "/images/logos/invoice_logo.webp": "/images/logos/Verified-bm-shop-logo.png",
  "/images/logos/homepage_hero_logo.webp": "/images/logos/Verified-bm-shop-logo.png",
  "/images/logos/favicon.webp": "/images/logos/vbb-logo.png",
};

export const resolveLegacyBrandingAsset = (path: string): string => {
  if (!path) return path;

  const qIndex = path.indexOf("?");
  const cleanPath = qIndex >= 0 ? path.slice(0, qIndex) : path;
  const query = qIndex >= 0 ? path.slice(qIndex) : "";

  return `${LEGACY_BRANDING_ASSET_MAP[cleanPath] || cleanPath}${query}`;
};

const normalizePath = (path: string) => path.replace(/^(\.\/|\/+)+/, "");

const stripKnownPrefixes = (path: string): string => {
  let clean = normalizePath(path);
  clean = clean.replace(/^admin\/media\//, "");
  clean = clean.replace(/^images\//, "");
  clean = clean.replace(/^storage\/v1\/object\/public\//, "");
  clean = clean.replace(/^branding\//, "logos/");
  clean = clean.replace(/^media\//, "");
  return clean;
};

export const getAdminMediaUrl = (path: string): string => {
  if (!path) return path;
  const clean = stripKnownPrefixes(path.split("?")[0]);
  return resolveLegacyBrandingAsset(`${LOCAL_IMAGES_PREFIX}${clean}`);
};

/**
 * Convert any app image URL or relative path into the admin panel media URL.
 */
export const toBrandedUrl = (url: string): string => {
  if (!url) return url;
  if (url.startsWith("blob:") || url.startsWith("data:")) return url;

  const qIndex = url.indexOf("?");
  const cleanUrl = qIndex >= 0 ? url.slice(0, qIndex) : url;
  const query = qIndex >= 0 ? url.slice(qIndex) : "";

  // Keep local public images untouched so static assets from /public/images work in dev and production.
  if (cleanUrl.startsWith("/images/")) return resolveLegacyBrandingAsset(`${cleanUrl}${query}`);

  if (cleanUrl.startsWith(LOCAL_IMAGES_PREFIX)) return resolveLegacyBrandingAsset(`${cleanUrl}${query}`);
  if (cleanUrl.startsWith(SITE_URL)) {
    const relative = cleanUrl.substring(SITE_URL.length);
    if (relative.startsWith("/images/")) return resolveLegacyBrandingAsset(`${cleanUrl}${query}`);
    return `${getAdminMediaUrl(relative)}${query}`;
  }

  if (cleanUrl.includes("/storage/v1/object/public/media/")) {
    const relative = cleanUrl.split("/storage/v1/object/public/media/")[1] || "";
    return `${getAdminMediaUrl(relative)}${query}`;
  }

  if (cleanUrl.includes("/storage/v1/object/public/branding/")) {
    const relative = cleanUrl.split("/storage/v1/object/public/branding/")[1] || "";
    return `${getAdminMediaUrl(`logos/${relative}`)}${query}`;
  }

  if (cleanUrl.startsWith("/")) {
    return `${getAdminMediaUrl(cleanUrl)}${query}`;
  }
  if (!cleanUrl.startsWith("http")) {
    return `${getAdminMediaUrl(cleanUrl)}${query}`;
  }

  // Normalize legacy absolute URLs (e.g. localhost) that still point to media endpoints.
  try {
    const parsed = new URL(cleanUrl);
    const path = parsed.pathname || "";
    if (
      path.startsWith("/admin/media/") ||
      path.startsWith("/images/") ||
      path.startsWith("/media/") ||
      path.startsWith("/branding/") ||
      path.startsWith("/storage/v1/object/public/")
    ) {
      return `${getAdminMediaUrl(path)}${query}`;
    }
  } catch {
    // Ignore malformed absolute URLs and return as-is below.
  }

  return resolveLegacyBrandingAsset(`${cleanUrl}${query}`);
};

/**
 * Convert an image File to WebP format at specified quality using Canvas API.
 * Returns the original file if conversion fails or file is already WebP.
 */
export const convertToWebP = async (
  file: File,
  quality: number = 0.8
): Promise<File> => {
  // Already WebP — skip
  if (file.type === "image/webp") return file;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            // Build new filename with .webp extension
            const baseName = file.name.replace(/\.[^.]+$/, "");
            const webpFile = new File([blob], `${baseName}.webp`, {
              type: "image/webp",
            });
            resolve(webpFile);
          },
          "image/webp",
          quality
        );
      } catch {
        resolve(file);
      }
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
};
