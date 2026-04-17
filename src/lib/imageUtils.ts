const SUPABASE_STORAGE_BASE = "https://xukkejkvcgixogvbllmf.supabase.co/storage/v1/object/public/media/";
const SUPABASE_BRANDING_BASE = "https://xukkejkvcgixogvbllmf.supabase.co/storage/v1/object/public/branding/";
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
const ADMIN_MEDIA_PREFIX = `${SITE_URL}/admin/media/`;

const normalizePath = (path: string) => path.replace(/^(\.\/|\/+)+/, "");

const stripKnownPrefixes = (path: string): string => {
  let clean = normalizePath(path);
  clean = clean.replace(/^admin\/media\//, "");
  clean = clean.replace(/^storage\/v1\/object\/public\//, "");
  clean = clean.replace(/^media\//, "");
  return clean;
};

export const getAdminMediaUrl = (path: string): string => {
  if (!path) return path;
  const clean = stripKnownPrefixes(path.split("?")[0]);
  return `${ADMIN_MEDIA_PREFIX}${clean}`;
};

/**
 * Convert any app image URL or relative path into the admin panel media URL.
 */
export const toBrandedUrl = (url: string): string => {
  if (!url) return url;
  if (url.startsWith("blob:") || url.startsWith("data:")) return url;

  const cleanUrl = url.split("?")[0];
  if (cleanUrl.startsWith(ADMIN_MEDIA_PREFIX)) return cleanUrl;
  if (cleanUrl.startsWith(SITE_URL)) {
    const relative = cleanUrl.substring(SITE_URL.length);
    return getAdminMediaUrl(relative);
  }
  if (cleanUrl.startsWith(SUPABASE_STORAGE_BASE)) {
    const relative = cleanUrl.substring(SUPABASE_STORAGE_BASE.length);
    return getAdminMediaUrl(relative);
  }
  if (cleanUrl.startsWith(SUPABASE_BRANDING_BASE)) {
    const relative = cleanUrl.substring(SUPABASE_BRANDING_BASE.length);
    return getAdminMediaUrl(`branding/${relative}`);
  }
  if (cleanUrl.startsWith("/")) {
    return getAdminMediaUrl(cleanUrl);
  }
  if (!cleanUrl.startsWith("http")) {
    return getAdminMediaUrl(cleanUrl);
  }

  return cleanUrl;
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
