import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PAGE_SEO_STALE_TIME = 15 * 60 * 1000;

export interface PageSEO {
  title: string | null;
  meta_title: string | null;
  meta_description: string | null;
  hero_image: string | null;
  hero_overlay: number;
}

/**
 * Fetches page-level SEO & hero data from the `pages` table for a given slug.
 * Use in hardcoded pages (Shop, About, Contact, etc.) so admin edits apply.
 */
export const usePageSEO = (slug: string) => {
  const { data, isLoading } = useQuery({
    queryKey: ["page-seo", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("pages")
        .select("title, meta_title, meta_description, hero_image, hero_overlay")
        .eq("slug", slug)
        .maybeSingle();

      if (!data) return null;

      return {
        title: data.title,
        meta_title: data.meta_title,
        meta_description: data.meta_description,
        hero_image: data.hero_image || null,
        hero_overlay: data.hero_overlay ?? 50,
      } as PageSEO;
    },
    enabled: !!slug,
    staleTime: PAGE_SEO_STALE_TIME,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  return { pageSEO: data ?? null, loading: isLoading };
};
