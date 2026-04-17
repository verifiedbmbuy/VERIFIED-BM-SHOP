import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import StatsCards from "@/components/admin/dashboard/StatsCards";
import RecentActivityTable from "@/components/admin/dashboard/RecentActivityTable";
import QuickDraftWidget from "@/components/admin/dashboard/QuickDraftWidget";
import ActivityFeed, { type FeedItem } from "@/components/admin/dashboard/ActivityFeed";
import SEOHealthWidget from "@/components/admin/SEOHealthWidget";
import SalesAnalyticsWidget from "@/components/admin/SalesAnalyticsWidget";

const AdminDashboard = () => {
  const { profile } = useAuth();
  const [draftFeedItems, setDraftFeedItems] = useState<FeedItem[]>([]);

  const handleDraftSaved = useCallback((item: FeedItem) => {
    setDraftFeedItems((prev) => [item, ...prev]);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">Here's what's happening with your site today.</p>
      </div>

      <StatsCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivityTable />
        </div>
        <div className="space-y-6">
          <QuickDraftWidget onDraftSaved={handleDraftSaved} />
          <ActivityFeed extraItems={draftFeedItems} />
        </div>
      </div>

      <SalesAnalyticsWidget />
      <SEOHealthWidget />
    </div>
  );
};

export default AdminDashboard;
