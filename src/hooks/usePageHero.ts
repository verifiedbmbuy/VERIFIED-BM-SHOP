import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PageHeroSettings {
  image: string;
  overlay: number; // 0-100
}

export const usePageHero = () => {
  const [settings, setSettings] = useState<PageHeroSettings>({ image: "", overlay: 50 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["page_hero_image", "page_hero_overlay"]);

      if (data) {
        const map: Record<string, string> = {};
        data.forEach((r) => { map[r.key] = r.value; });
        setSettings({
          image: map.page_hero_image || "",
          overlay: parseInt(map.page_hero_overlay || "50", 10),
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  return { settings, loading };
};
