import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useMaintenanceMode = () => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "maintenance_mode")
        .maybeSingle();
      setIsMaintenanceMode(data?.value === "true");
      setLoading(false);
    };
    check();
  }, []);

  return { isMaintenanceMode, loading };
};
