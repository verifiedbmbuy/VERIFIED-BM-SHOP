import { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, TrendingUp, Activity, BarChart3, FileDown, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Asset {
  id: string;
  name: string;
  type: string;
  status: string;
  daily_spend_limit: number | null;
}

const COLORS: Record<string, string> = {
  "e-Commerce": "#2271b1",
  "Ad Account": "#d63638",
  "Page": "#00a32a",
};

const AdminFinancialOverview = () => {
  const { role, canAccess } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [animated, setAnimated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const hasAccess = canAccess("finance");

  useEffect(() => {
    if (!hasAccess) return;
    const fetchAssets = async () => {
      const { data } = await supabase.from("assets").select("*");
      if (data) setAssets(data as Asset[]);
      setLoading(false);
    };
    fetchAssets();
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, [hasAccess]);

  if (!hasAccess) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center space-y-3 animate-in fade-in duration-300">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Admin Only</h2>
          <p className="text-sm text-gray-500 max-w-xs">The Financial Overview is restricted to administrators.</p>
        </div>
      </div>
    );
  }

  const activeAssets = assets.filter((a) => a.status !== "Restricted");
  const totalDailyExposure = activeAssets.reduce((sum, a) => sum + (a.daily_spend_limit || 0), 0);
  const activeCampaignCount = activeAssets.filter((a) => (a.daily_spend_limit || 0) > 0).length;
  const restrictedCount = assets.filter((a) => a.status === "Restricted").length;
  const avgSpend = activeCampaignCount > 0 ? (totalDailyExposure / activeCampaignCount).toFixed(0) : "0";

  // Chart data grouped by type
  const chartData = Object.entries(
    activeAssets.reduce((acc, a) => {
      const type = a.type || "Other";
      acc[type] = (acc[type] || 0) + (a.daily_spend_limit || 0);
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const stats = [
    { label: "Total Daily Ad Exposure", value: `$${totalDailyExposure.toLocaleString()}`, icon: DollarSign, color: "bg-[#2271b1]/10 text-[#2271b1]", border: "border-[#2271b1]/20" },
    { label: "Active Campaigns", value: activeCampaignCount, icon: TrendingUp, color: "bg-green-500/10 text-green-600", border: "border-green-500/20" },
    { label: "Restricted Assets", value: restrictedCount, icon: Activity, color: "bg-red-500/10 text-red-500", border: "border-red-500/20" },
    { label: "Avg. Spend / Campaign", value: `$${Number(avgSpend).toLocaleString()}`, icon: BarChart3, color: "bg-amber-500/10 text-amber-600", border: "border-amber-500/20" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#2271b1] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const generateReport = async () => {
    setGenerating(true);
    // Build CSV-style report data
    const now = new Date().toLocaleDateString();
    const lines = [
      `Financial Report — ${now}`,
      "",
      `Total Daily Ad Exposure: $${totalDailyExposure.toLocaleString()}`,
      `Active Campaigns: ${activeCampaignCount}`,
      `Restricted Assets: ${restrictedCount}`,
      `Avg. Spend / Campaign: $${avgSpend}`,
      "",
      "Asset Breakdown:",
      "Name, Type, Status, Daily Spend Limit",
      ...assets.map((a) => `${a.name}, ${a.type}, ${a.status}, $${(a.daily_spend_limit || 0).toLocaleString()}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Financial_Report_${now.replace(/\//g, "-")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setGenerating(false), 800);
  };

  return (
    <div className="space-y-6" ref={reportRef}>
      <Helmet><title>Financial Overview — Admin</title></Helmet>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Financial Overview</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Aggregated daily ad exposure and campaign metrics</p>
        </div>
        <Button
          onClick={generateReport}
          disabled={generating}
          className="gap-2 bg-[#2271b1] hover:bg-[#135e96] text-white"
          size="sm"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
          Generate Client Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`bg-white rounded-xl border ${stat.border} p-5 transition-all duration-500 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ transitionDelay: `${i * 80}ms` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div
          className={`lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 transition-all duration-500 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={{ transitionDelay: "400ms" }}
        >
          <h2 className="text-base font-semibold text-gray-900 mb-4">Spend by Asset Type</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} />
                <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Daily Spend"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={COLORS[entry.name] || "#8884d8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-sm text-gray-400">
              No active assets with spend limits
            </div>
          )}
        </div>

        {/* Breakdown List */}
        <div
          className={`bg-white rounded-xl border border-gray-200 p-6 transition-all duration-500 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={{ transitionDelay: "500ms" }}
        >
          <h2 className="text-base font-semibold text-gray-900 mb-4">Top Assets by Spend</h2>
          <div className="space-y-3">
            {activeAssets
              .filter((a) => (a.daily_spend_limit || 0) > 0)
              .sort((a, b) => (b.daily_spend_limit || 0) - (a.daily_spend_limit || 0))
              .slice(0, 8)
              .map((asset) => {
                const pct = totalDailyExposure > 0 ? ((asset.daily_spend_limit || 0) / totalDailyExposure) * 100 : 0;
                return (
                  <div key={asset.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 font-medium truncate max-w-[150px]">{asset.name}</span>
                      <span className="text-gray-500 text-xs">${(asset.daily_spend_limit || 0).toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: COLORS[asset.type] || "#8884d8",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            {activeAssets.filter((a) => (a.daily_spend_limit || 0) > 0).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No assets with spend limits</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFinancialOverview;
