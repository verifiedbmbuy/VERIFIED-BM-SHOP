import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";
import MaintenancePage from "@/pages/MaintenancePage";

const MaintenanceGuard = ({ children }: { children: ReactNode }) => {
  const { isMaintenanceMode, loading } = useMaintenanceMode();
  const { role } = useAuth();
  const location = useLocation();

  // Don't block admin routes or if still loading
  if (loading) return <>{children}</>;
  
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAdmin = role === "admin" || role === "editor";

  if (isMaintenanceMode && !isAdminRoute && !isAdmin) {
    return <MaintenancePage />;
  }

  return <>{children}</>;
};

export default MaintenanceGuard;
