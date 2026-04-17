import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface InternationalSEOConfig {
  targetLang: string;
  geoRegion: string;
  geoPlacename: string;
  targetRegions: string[];
}

const DEFAULTS: InternationalSEOConfig = {
  targetLang: "en",
  geoRegion: "",
  geoPlacename: "",
  targetRegions: [],
};

export const useInternationalSEO = () => {
  const [config, setConfig] = useState<InternationalSEOConfig>(DEFAULTS);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "international_seo")
        .maybeSingle();

      if (data?.value) {
        try {
          setConfig({ ...DEFAULTS, ...JSON.parse(data.value) });
        } catch {}
      }
    };
    load();
  }, []);

  return config;
};

export const saveInternationalSEO = async (config: InternationalSEOConfig) => {
  const value = JSON.stringify(config);
  const { data: existing } = await supabase
    .from("site_settings")
    .select("key")
    .eq("key", "international_seo")
    .maybeSingle();

  if (existing) {
    await supabase
      .from("site_settings")
      .update({ value, updated_at: new Date().toISOString() })
      .eq("key", "international_seo");
  } else {
    await supabase
      .from("site_settings")
      .insert({ key: "international_seo", value });
  }
};
