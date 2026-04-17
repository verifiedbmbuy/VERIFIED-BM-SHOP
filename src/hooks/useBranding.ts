import { useQuery } from "@tanstack/react-query";
import { supabase, isLocalProtectedMode } from "@/integrations/supabase/client";
import { toBrandedUrl } from "@/lib/imageUtils";

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

const getDevBrandingOverrides = (): Record<string, string> => {
  if (typeof window === "undefined" || !isLocalProtectedMode) return {};
  try {
    const raw = window.localStorage.getItem(DEV_BRANDING_OVERRIDES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

/** Ensure a branding URL uses the public endpoint */
const ensurePublicUrl = (url: string): string => {
  if (!url) return "";
  const base = url.split("?")[0];
  if (!base.startsWith("http")) {
    if (
      base.startsWith("/admin/media/") ||
      base.startsWith("admin/media/") ||
      base.startsWith("/media/") ||
      base.startsWith("media/") ||
      base.startsWith("/branding/") ||
      base.startsWith("branding/")
    ) {
      return toBrandedUrl(base);
    }
    const { data } = supabase.storage.from("branding").getPublicUrl(base);
    return toBrandedUrl(data.publicUrl);
  }
  const fixed = base.includes("/object/public/") ? base : base.replace("/object/", "/object/public/");
  return toBrandedUrl(fixed);
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
  return {
    header_logo: ensurePublicUrl(localOverrides.header_logo ?? map.header_logo ?? ""),
    footer_logo: ensurePublicUrl(localOverrides.footer_logo ?? map.footer_logo ?? ""),
    favicon: ensurePublicUrl(localOverrides.favicon ?? map.favicon ?? ""),
    invoice_logo: ensurePublicUrl(localOverrides.invoice_logo ?? map.invoice_logo ?? ""),
    site_title: localOverrides.site_title ?? map.site_title ?? "Verified BM Shop",
    homepage_hero_logo: ensurePublicUrl(localOverrides.homepage_hero_logo ?? map.homepage_hero_logo ?? ""),
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
