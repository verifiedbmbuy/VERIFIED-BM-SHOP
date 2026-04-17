import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { SchemaConfig } from "@/lib/jsonLdSchemas";
import { DEFAULT_SCHEMA_CONFIG } from "@/lib/jsonLdSchemas";

const SCHEMA_SETTINGS_KEY = "schema_config";

export const useSchemaConfig = () => {
  const [config, setConfig] = useState<SchemaConfig>(DEFAULT_SCHEMA_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", SCHEMA_SETTINGS_KEY)
        .maybeSingle();

      if (data?.value) {
        try {
          const parsed = JSON.parse(data.value);
          setConfig({ ...DEFAULT_SCHEMA_CONFIG, ...parsed });
        } catch {}
      }
      setLoading(false);
    };
    load();
  }, []);

  return { config, loading };
};

export const saveSchemaConfig = async (config: SchemaConfig) => {
  const value = JSON.stringify(config);
  const { data: existing } = await supabase
    .from("site_settings")
    .select("key")
    .eq("key", SCHEMA_SETTINGS_KEY)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("site_settings")
      .update({ value, updated_at: new Date().toISOString() })
      .eq("key", SCHEMA_SETTINGS_KEY);
  } else {
    await supabase
      .from("site_settings")
      .insert({ key: SCHEMA_SETTINGS_KEY, value });
  }
};
