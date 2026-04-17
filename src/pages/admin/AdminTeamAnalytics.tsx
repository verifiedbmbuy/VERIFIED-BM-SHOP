import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { Users, CheckCircle, BarChart3, Globe, Search as SearchIcon, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";

/* ─── Team Data ────────────────────────────────────────────────────── */

const TEAM = [
  {
    name: "Akhi Vai",
    role: "Lead Manager",
    avatar: "AV",
    color: "#2271b1",
    assets: 24,
    tasks: 142,
    activity: [12, 18, 9, 22, 15, 28, 20],
  },
  {
    name: "Shopon",
    role: "Ad Operations",
    avatar: "SH",
    color: "#00a32a",
    assets: 18,
    tasks: 98,
    activity: [8, 14, 20, 11, 16, 19, 25],
  },
  {
    name: "Tasneem",
    role: "Account Specialist",
    avatar: "TA",
    color: "#8c5ae8",
    assets: 15,
    tasks: 117,
    activity: [10, 7, 15, 22, 18, 12, 21],
  },
  {
    name: "Maruf",
    role: "Support Lead",
    avatar: "MA",
    color: "#dba617",
    assets: 12,
    tasks: 76,
    activity: [5, 11, 8, 14, 19, 10, 16],
  },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ─── Site Health Data ─────────────────────────────────────────────── */

interface SiteRow {
  id: string;
  domain: string;
  lighthouse: number;
  seoStatus: "complete" | "partial" | "missing";
  renderBlocking: number;
}

const initialSites: SiteRow[] = [
  { id: "1", domain: "verifiedbm.shop", lighthouse: 94, seoStatus: "complete", renderBlocking: 0 },
  { id: "2", domain: "shop.verifiedbm.com", lighthouse: 87, seoStatus: "complete", renderBlocking: 2 },
  { id: "3", domain: "blog.verifiedbm.com", lighthouse: 72, seoStatus: "partial", renderBlocking: 5 },
  { id: "4", domain: "api.verifiedbm.com", lighthouse: 96, seoStatus: "complete", renderBlocking: 0 },
  { id: "5", domain: "landing.verifiedbm.com", lighthouse: 45, seoStatus: "missing", renderBlocking: 8 },
  { id: "6", domain: "docs.verifiedbm.com", lighthouse: 91, seoStatus: "complete", renderBlocking: 1 },
];

const lighthouseColor = (score: number) => {
  if (score >= 90) return "bg-emerald-100 text-emerald-700";
  if (score >= 50) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
};

const seoStatusStyle: Record<string, { bg: string; label: string }> = {
  complete: { bg: "bg-emerald-100 text-emerald-700", label: "Complete" },
  partial: { bg: "bg-yellow-100 text-yellow-700", label: "Partial" },
  missing: { bg: "bg-red-100 text-red-700", label: "Missing" },
};

/* ─── Main Page ────────────────────────────────────────────────────── */

const AdminTeamAnalytics = () => {
  const [siteSearch, setSiteSearch] = useState("");
  const [sites] = useState<SiteRow[]>(initialSites);

  const filteredSites = useMemo(
    () =>
      siteSearch.trim()
        ? sites.filter((s) => s.domain.toLowerCase().includes(siteSearch.toLowerCase()))
        : sites,
    [sites, siteSearch]
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Team Analytics</h2>
        <p className="text-sm text-gray-500 mt-0.5">Performance overview across your team and web properties.</p>
      </div>

      {/* ─── Team Profile Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {TEAM.map((member, idx) => {
          const chartData = member.activity.map((v, i) => ({ day: DAYS[i], value: v }));
          return (
            <div
              key={member.name}
              className="bg-white rounded-lg border border-[#dcdcde] p-5 hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: `${idx * 80}ms`, animationFillMode: "both" }}
            >
              {/* Avatar + Info */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ backgroundColor: member.color }}
                >
                  {member.avatar}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{member.name}</p>
                  <p className="text-[11px] text-gray-400">{member.role}</p>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <p className="text-lg font-bold text-gray-900">{member.assets}</p>
                  <p className="text-[10px] text-gray-500 font-medium">Assets Managed</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <p className="text-lg font-bold text-gray-900">{member.tasks}</p>
                  <p className="text-[10px] text-gray-500 font-medium">Tasks Completed</p>
                </div>
              </div>

              {/* Weekly Activity Chart */}
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Weekly Activity</p>
                <ResponsiveContainer width="100%" height={60}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={member.color} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={member.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" hide />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        background: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "11px",
                        padding: "4px 8px",
                      }}
                      formatter={(v: number) => [v, "Actions"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={member.color}
                      strokeWidth={2}
                      fill={`url(#grad-${idx})`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Site Health & Tech Metrics ──────────────────────────────── */}
      <div
        className="animate-in fade-in slide-in-from-bottom-3 duration-300"
        style={{ animationDelay: "250ms", animationFillMode: "both" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-gray-400" />
              Site Health & Tech Metrics
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Monitor web property performance and SEO readiness.</p>
          </div>
          <div className="relative max-w-xs">
            <SearchIcon className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={siteSearch}
              onChange={(e) => setSiteSearch(e.target.value)}
              placeholder="Filter domains…"
              className="h-8 pl-8 text-xs border-gray-300"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#dcdcde] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f6f7f7] text-gray-500 text-[11px] uppercase tracking-wider">
                  <th className="text-left px-4 py-2.5 font-semibold">Domain</th>
                  <th className="text-center px-4 py-2.5 font-semibold">Lighthouse Score</th>
                  <th className="text-center px-4 py-2.5 font-semibold">SEO Metadata</th>
                  <th className="text-center px-4 py-2.5 font-semibold">Render-Blocking</th>
                </tr>
              </thead>
              <tbody>
                {filteredSites.map((site, idx) => {
                  const seo = seoStatusStyle[site.seoStatus];
                  return (
                    <tr
                      key={site.id}
                      className="border-t border-[#f0f0f1] hover:bg-[#f6f7f7] transition-colors animate-in fade-in duration-200"
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-gray-900">{site.domain}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          "inline-flex items-center justify-center min-w-[36px] px-2 py-0.5 rounded-full text-[11px] font-bold",
                          lighthouseColor(site.lighthouse)
                        )}>
                          {site.lighthouse}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          "inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold",
                          seo.bg
                        )}>
                          {seo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          "text-xs font-medium",
                          site.renderBlocking === 0 ? "text-emerald-600" : site.renderBlocking <= 3 ? "text-yellow-600" : "text-red-600"
                        )}>
                          {site.renderBlocking === 0 ? "None" : `${site.renderBlocking} issues`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredSites.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-400">
                      No domains match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredSites.length > 0 && (
            <div className="px-4 py-2.5 border-t border-[#f0f0f1] bg-[#f6f7f7] text-xs text-gray-500 flex items-center justify-between">
              <span>{filteredSites.length} propert{filteredSites.length !== 1 ? "ies" : "y"}</span>
              <span>
                Avg. Lighthouse: {Math.round(filteredSites.reduce((s, r) => s + r.lighthouse, 0) / filteredSites.length)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTeamAnalytics;
