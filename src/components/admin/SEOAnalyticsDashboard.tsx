import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { computeSEOScore } from "@/lib/seoScoring";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3, Eye, MousePointerClick, Hash, TrendingUp, TrendingDown,
  ArrowUp, ArrowDown, Minus, Info, Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell,
} from "recharts";

/* ─── Types ─── */
interface ScoreBucket {
  good: number;
  fair: number;
  poor: number;
  noData: number;
}

/* ─── Gauge Chart ─── */
const GaugeChart = ({ score, label }: { score: number; label: string }) => {
  const size = 160;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = Math.PI * radius; // semi-circle
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80 ? "hsl(142, 70%, 45%)" :
    score >= 50 ? "hsl(45, 93%, 47%)" :
    "hsl(0, 84%, 60%)";

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
        {/* Background arc */}
        <path
          d={`M ${stroke / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - stroke / 2} ${size / 2}`}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* Score arc */}
        <path
          d={`M ${stroke / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - stroke / 2} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000"
        />
        {/* Score text */}
        <text x={size / 2} y={size / 2 - 8} textAnchor="middle" className="fill-foreground text-3xl font-bold" fontSize="36">
          {score}
        </text>
        <text x={size / 2} y={size / 2 + 16} textAnchor="middle" className="fill-muted-foreground text-xs" fontSize="12">
          / 100
        </text>
      </svg>
      <p className="text-sm font-semibold text-foreground -mt-1">{label}</p>
    </div>
  );
};

/* ─── Stat Card ─── */
const StatCard = ({
  icon: Icon, label, value, subtitle,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtitle?: string;
}) => (
  <div className="bg-background rounded-xl border border-border p-4 flex flex-col gap-1">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="w-4 h-4" />
      <span className="text-xs font-medium">{label}</span>
    </div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
    {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
  </div>
);

/* ─── Keyword Row ─── */
const KeywordRow = ({
  keyword, position, change, url,
}: {
  keyword: string;
  position: number;
  change: number;
  url: string;
}) => (
  <div className="flex items-center gap-3 py-2.5 px-3 border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-foreground truncate">{keyword}</p>
      <p className="text-[11px] text-muted-foreground truncate">{url}</p>
    </div>
    <div className="text-right shrink-0 flex items-center gap-2">
      <Badge variant="outline" className="text-xs font-mono">#{position}</Badge>
      <span className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        change > 0 ? "text-[hsl(142,70%,45%)]" : change < 0 ? "text-destructive" : "text-muted-foreground"
      )}>
        {change > 0 ? <ArrowUp className="w-3 h-3" /> : change < 0 ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
        {Math.abs(change)}
      </span>
    </div>
  </div>
);

/* ─── Main Component ─── */
const SEOAnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [avgScore, setAvgScore] = useState(0);
  const [buckets, setBuckets] = useState<ScoreBucket>({ good: 0, fair: 0, poor: 0, noData: 0 });
  const [totalPages, setTotalPages] = useState(0);
  const [gscConnected] = useState(false); // Will be true when GSC API is connected

  useEffect(() => {
    const analyze = async () => {
      const [postsRes, productsRes] = await Promise.all([
        supabase.from("blog_posts").select("id, title, slug, content, meta_title, meta_description, focus_keyword, featured_image, status"),
        supabase.from("products").select("id, title, slug, description, meta_title, meta_description, short_description, image_url, focus_keyword"),
      ]);

      const scores: number[] = [];
      let good = 0, fair = 0, poor = 0, noData = 0;

      // Audit posts
      for (const post of (postsRes.data || []) as any[]) {
        if (post.status === "draft") { noData++; continue; }
        const result = computeSEOScore({
          title: post.title,
          slug: post.slug,
          metaTitle: post.meta_title,
          metaDescription: post.meta_description,
          focusKeyword: post.focus_keyword,
          content: post.content,
          urlPrefix: "/blog/",
        });
        scores.push(result.score);
        if (result.score >= 80) good++;
        else if (result.score >= 50) fair++;
        else poor++;
      }

      // Audit products
      for (const prod of (productsRes.data || []) as any[]) {
        const result = computeSEOScore({
          title: prod.title,
          slug: prod.slug,
          metaTitle: prod.meta_title,
          metaDescription: prod.meta_description,
          focusKeyword: prod.focus_keyword,
          content: prod.description || prod.short_description || "",
          urlPrefix: "/product/",
        });
        scores.push(result.score);
        if (result.score >= 80) good++;
        else if (result.score >= 50) fair++;
        else poor++;
      }

      const avg = scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0;
      setAvgScore(avg);
      setBuckets({ good, fair, poor, noData });
      setTotalPages(good + fair + poor + noData);
      setLoading(false);
    };
    analyze();
  }, []);

  // Keyword positions bar chart data (placeholder until GSC connected)
  const positionData = useMemo(() => [
    { name: "Top 3", value: gscConnected ? 0 : 0, fill: "hsl(217, 91%, 40%)" },
    { name: "4–10", value: gscConnected ? 0 : 0, fill: "hsl(217, 91%, 55%)" },
    { name: "11–50", value: gscConnected ? 0 : 0, fill: "hsl(217, 91%, 72%)" },
    { name: "51–100", value: gscConnected ? 0 : 0, fill: "hsl(217, 60%, 85%)" },
  ], [gscConnected]);

  // Placeholder keywords
  const placeholderKeywords = useMemo(() => [
    { keyword: "buy verified bm", position: 0, change: 0, url: "/shop" },
    { keyword: "verified facebook business manager", position: 0, change: 0, url: "/product/verified-bm" },
    { keyword: "whatsapp api", position: 0, change: 0, url: "/product/whatsapp-api" },
  ], []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Row 1: Gauge + Performance Stats ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gauge + Legend */}
        <div className="bg-background rounded-xl border border-border p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> Overall SEO Score
          </h3>
          <div className="flex flex-col items-center gap-4">
            <GaugeChart score={avgScore} label="Average Score" />
            <div className="w-full space-y-2 mt-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[hsl(142,70%,45%)]" />
                  <span className="text-muted-foreground">Good (80–100)</span>
                </div>
                <span className="font-bold text-foreground">{buckets.good}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[hsl(45,93%,47%)]" />
                  <span className="text-muted-foreground">Fair (50–79)</span>
                </div>
                <span className="font-bold text-foreground">{buckets.fair}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[hsl(0,84%,60%)]" />
                  <span className="text-muted-foreground">Poor (&lt;50)</span>
                </div>
                <span className="font-bold text-foreground">{buckets.poor}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                  <span className="text-muted-foreground">No Data</span>
                </div>
                <span className="font-bold text-foreground">{buckets.noData}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Stats Cards */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <StatCard
            icon={Eye}
            label="Total Impressions"
            value={gscConnected ? "—" : "n/a"}
            subtitle={gscConnected ? "Last 28 days" : "Connect Google Search Console"}
          />
          <StatCard
            icon={MousePointerClick}
            label="Total Clicks"
            value={gscConnected ? "—" : "n/a"}
            subtitle={gscConnected ? "Last 28 days" : "Connect Google Search Console"}
          />
          <StatCard
            icon={Hash}
            label="Total Keywords"
            value={gscConnected ? "—" : "n/a"}
            subtitle={gscConnected ? "Ranking keywords" : "Connect Google Search Console"}
          />
          <StatCard
            icon={TrendingUp}
            label="Average Position"
            value={gscConnected ? "—" : "n/a"}
            subtitle={gscConnected ? "Mean position" : "Connect Google Search Console"}
          />
        </div>
      </div>

      {/* ─── Row 2: Keyword Positions Chart ─── */}
      <div className="bg-background rounded-xl border border-border p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" /> Keyword Positions
        </h3>
        {!gscConnected ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground font-medium">No data available yet</p>
            <p className="text-xs text-muted-foreground mt-1">Connect Google Search Console in the settings tab to see keyword ranking distribution.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={positionData} barCategoryGap="25%">
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <RechartsTooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: 12 }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {positionData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ─── Row 3: Keyword Tracking Table ─── */}
      <div className="bg-background rounded-xl border border-border p-6">
        <Tabs defaultValue="all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Hash className="w-4 h-4 text-primary" /> Keyword Tracking
            </h3>
            <TabsList className="bg-secondary/50 h-8">
              <TabsTrigger value="all" className="text-xs h-7">All Keywords</TabsTrigger>
              <TabsTrigger value="tracked" className="text-xs h-7">Tracked Keywords</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all">
            {!gscConnected ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Winning */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-[hsl(142,70%,45%)]" />
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">Top Winning Keywords</h4>
                  </div>
                  <div className="border border-border rounded-lg">
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Info className="w-6 h-6 text-muted-foreground/30 mb-2" />
                      <p className="text-xs text-muted-foreground">Connect Google Search Console to view winning keywords</p>
                    </div>
                  </div>
                </div>
                {/* Losing */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingDown className="w-4 h-4 text-destructive" />
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">Top Losing Keywords</h4>
                  </div>
                  <div className="border border-border rounded-lg">
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Info className="w-6 h-6 text-muted-foreground/30 mb-2" />
                      <p className="text-xs text-muted-foreground">Connect Google Search Console to view losing keywords</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-[hsl(142,70%,45%)]" />
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">Top Winning Keywords</h4>
                  </div>
                  <div className="border border-border rounded-lg">
                    {placeholderKeywords.map((kw, i) => (
                      <KeywordRow key={i} {...kw} />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingDown className="w-4 h-4 text-destructive" />
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">Top Losing Keywords</h4>
                  </div>
                  <div className="border border-border rounded-lg">
                    {placeholderKeywords.map((kw, i) => (
                      <KeywordRow key={i} {...kw} change={-kw.change} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tracked">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Target className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground font-medium">No tracked keywords yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add focus keywords to your posts and products to track their ranking performance.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ─── GSC Info Banner ─── */}
      {!gscConnected && (
        <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl border border-primary/15">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Google Search Console Not Connected</p>
            <p className="text-xs text-muted-foreground mt-1">
              Go to <span className="font-medium text-foreground">SEO Settings → Search Console</span> tab to add your verification tag. 
              For full analytics (impressions, clicks, keyword positions), upload your Google JSON key file in the Search Console settings.
              Data refreshes automatically every 24 hours when connected.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SEOAnalyticsDashboard;
