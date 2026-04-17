import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Megaphone } from "lucide-react";

const AnnouncementBar = () => {
  useEffect(() => {
    const fetchNotice = async () => {
      const { data } = await supabase
        .from("site_notices")
        .select("id, message, created_at")
        .eq("is_active", true)
        .eq("type", "bar")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        const storageKey = `has_seen_notice_${data.id}_${btoa(data.message).slice(0, 12)}`;
        if (!sessionStorage.getItem(storageKey)) {
          toast(data.message, {
            icon: <Megaphone className="w-4 h-4 text-primary" />,
            duration: 10000,
            onDismiss: () => {
              sessionStorage.setItem(storageKey, "true");
            },
            onAutoClose: () => {
              sessionStorage.setItem(storageKey, "true");
            },
          });
          sessionStorage.setItem(storageKey, "true");
        }
      }
    };
    fetchNotice();
  }, []);

  return null;
};

export default AnnouncementBar;
