import { useQuery } from "@tanstack/react-query";
import { supabase, isLocalProtectedMode } from "@/integrations/supabase/client";
import { resolveLegacyBrandingAsset, toBrandedUrl } from "@/lib/imageUtils";

export interface BrandingSettings {
  header_logo: string;
  footer_logo: string;
  favicon: string;
  invoice_logo: string;
  site_title: string;
  homepage_hero_logo: string;
}

const BRANDING_KEYS = ["header_logo", "footer_logo", "favicon", "invoice_logo", "site_title", "homepage_hero_logo"];

const DEFAULT_BRANDING: BrandingSettings = {
  header_logo: "",
  footer_logo: "",
  favicon: "",
  invoice_logo: "",
  site_title: "Verified BM Shop",
  homepage_hero_logo: "",
};

const DEV_BRANDING_OVERRIDES_KEY = "dev_branding_overrides";
const DEV_OVERRIDE_DELETED = "__deleted__";
const MAX_LOCAL_DATA_URL_LENGTH = 350_000;
const LOCAL_BRANDING_BASE = "/images/logos/";

const stripBrandingPrefixes = (value: string): string => {
  return value
    .replace(/^\/+/, "")
    .replace(/^images\/logos\//, "")
    .replace(/^branding\//, "")
    .replace(/^storage\/v1\/object\/public\/branding\//, "");
};

const normalizeLocalBrandingUrl = (value: string): string => {
  const localHostPattern = /https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i;
  if (!localHostPattern.test(value)) return value;

  const storageMatch = value.match(/\/storage\/v1\/object\/(public\/)?branding\/([^?]+)/i);
  if (storageMatch?.[2]) {
    return `${LOCAL_BRANDING_BASE}${storageMatch[2].split("/").filter(Boolean).pop() || storageMatch[2]}`;
  }

  const mediaMatch = value.match(/\/admin\/media\/branding\/([^?]+)/i);
  if (mediaMatch?.[1]) {
    return `${LOCAL_BRANDING_BASE}${mediaMatch[1].split("/").filter(Boolean).pop() || mediaMatch[1]}`;
  }

  const fileMatch = value.match(/branding\/([^?]+)/i);
  if (fileMatch?.[1]) {
    return `${LOCAL_BRANDING_BASE}${fileMatch[1].split("/").filter(Boolean).pop() || fileMatch[1]}`;
  }

  return value;
};

const getDevBrandingOverrides = (): Record<string, string> => {
  if (typeof window === "undefined" || !isLocalProtectedMode) return {};
  try {
    const raw = window.localStorage.getItem(DEV_BRANDING_OVERRIDES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};

    const safe: Record<string, string> = {};
    Object.entries(parsed as Record<string, unknown>).forEach(([k, v]) => {
      if (typeof v !== "string") return;
      if (v.startsWith("data:") && v.length > MAX_LOCAL_DATA_URL_LENGTH) return;
      safe[k] = v;
    });
    return safe;
  } catch {
    return {};
  }
};

/** Ensure a branding URL uses the public endpoint */
const ensurePublicUrl = (url: string): string => {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  const normalized = normalizeLocalBrandingUrl(url);
  if (normalized !== url) return normalized;
  if (url.startsWith("/images/logos/")) return resolveLegacyBrandingAsset(url);
  if (!url.startsWith("http")) {
    const clean = stripBrandingPrefixes(url);
    return resolveLegacyBrandingAsset(`${LOCAL_BRANDING_BASE}${clean}`);
  }
  if (url.includes("/storage/v1/object/public/branding/")) {
    const clean = stripBrandingPrefixes(url.split("/storage/v1/object/public/branding/")[1] || "");
    return resolveLegacyBrandingAsset(`${LOCAL_BRANDING_BASE}${clean}`);
  }
  return resolveLegacyBrandingAsset(url);
};

const fetchBranding = async (): Promise<BrandingSettings> => {
  const { data } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", BRANDING_KEYS);

  if (!data) return DEFAULT_BRANDING;

  const map: Record<string, string> = {};
  data.forEach((r) => { map[r.key] = r.value; });
  const localOverrides = getDevBrandingOverrides();
  const pick = (key: keyof BrandingSettings, fallback = ""): string => {
    const override = localOverrides[key];
    if (override === DEV_OVERRIDE_DELETED) return "";
    return override ?? map[key] ?? fallback;
  };
  return {
    header_logo: ensurePublicUrl(pick("header_logo")),
    footer_logo: ensurePublicUrl(pick("footer_logo")),
    favicon: ensurePublicUrl(pick("favicon")),
    invoice_logo: ensurePublicUrl(pick("invoice_logo")),
    site_title: pick("site_title", "Verified BM Shop"),
    homepage_hero_logo: ensurePublicUrl(pick("homepage_hero_logo")),
  };
};

export const useBranding = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["branding"],
    queryFn: fetchBranding,
    staleTime: 60_000, // 1 min — all callers share one cached result
  });

  return { branding: data ?? DEFAULT_BRANDING, loading: isLoading };
};

/** Convert absolute Supabase URL to relative path for portability */
export const toRelativePath = (url: string): string => {
  if (!url) return url;
  try {
    const u = new URL(url);
    return u.pathname;
  } catch {
    return url;
  }
};
