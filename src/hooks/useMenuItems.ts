import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface MenuItem {
  id: string;
  label: string;
  url: string;
  position: string;
  sort_order: number;
  icon: string | null;
  icon_name: string | null;
}

export const useMenuItems = (position: string) => {
  return useQuery({
    queryKey: ["menus", position],
    queryFn: async () => {
      const { data } = await supabase
        .from("menus")
        .select("*")
        .eq("position", position)
        .order("sort_order");
      return (data || []) as MenuItem[];
    },
    staleTime: 60_000,
  });
};
