import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PAGE_CONTENT_STALE_TIME = 15 * 60 * 1000;

export interface PageContent {
  [key: string]: string;
}

export const usePageContent = (slug: string) => {
  const { data: content = {}, isLoading: loading } = useQuery({
    queryKey: ["page-content", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("pages")
        .select("content, components")
        .eq("slug", slug)
        .eq("status", "published")
        .single();
      if (data?.content) {
        try {
          return JSON.parse(data.content) as PageContent;
        } catch {
          return {} as PageContent;
        }
      }
      return {} as PageContent;
    },
    enabled: !!slug,
    staleTime: PAGE_CONTENT_STALE_TIME,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  return { content, loading };
};

export const usePageComponents = (slug: string) => {
  const { data: components = {} } = useQuery({
    queryKey: ["page-components", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("pages")
        .select("components")
        .eq("slug", slug)
        .eq("status", "published")
        .single();
      return (data?.components as Record<string, boolean>) || {};
    },
    enabled: !!slug,
    staleTime: PAGE_CONTENT_STALE_TIME,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  return components;
};
