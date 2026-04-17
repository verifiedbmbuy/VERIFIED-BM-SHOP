import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const usePageHeroBySlug = (slug: string) => {
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [heroOverlay, setHeroOverlay] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }

    const load = async () => {
      const { data } = await supabase
        .from("pages")
        .select("hero_image, hero_overlay")
        .eq("slug", slug)
        .single();

      if (data) {
        setHeroImage(data.hero_image || null);
        setHeroOverlay(data.hero_overlay ?? null);
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  return { heroImage, heroOverlay, loading };
};
