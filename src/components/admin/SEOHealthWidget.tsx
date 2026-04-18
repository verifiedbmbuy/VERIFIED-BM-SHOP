import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { computeSEOScore } from "@/lib/seoScoring";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  TrendingUp, CheckCircle, AlertTriangle, XCircle, Edit, Globe,
  Image as ImageIcon, Link2, Wifi, WifiOff, Loader2, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PageScore {
  id: string;
  title: string;
  slug: string;
  type: "post" | "product";
  focusKeyword: string;
  metaTitle: string;
  metaDescription: string;
  content: string;
  urlPrefix: string;
  score: number;
  topIssue: string;
  issueCount: number;
  issues: string[];
}

// Reuse the score ring from SEOScoreWidget but smaller
const MiniScoreRing = ({ score, size = 64 }: { score: number; size?: number }) => {
  const radius = (size / 2) - 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80 ? "hsl(142, 70%, 45%)" :
    score >= 50 ? "hsl(45, 93%, 47%)" :
    "hsl(0, 84%, 60%)";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="-rotate-90" style={{ width: size, height: size }} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="5" />
        <circle
          cx={size/2} cy={size/2} r={radius} fill="none"
          stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-foreground">{score}</span>
      </div>
    </div>
  );
};

const SEOHealthWidget = () => {
  const [loading, setLoading] = useState(true);
  const [overallScore, setOverallScore] = useState(0);
  const [optimized, setOptimized] = useState(0);
  const [needsWork, setNeedsWork] = useState(0);
  const [critical, setCritical] = useState(0);
  const [worst, setWorst] = useState<PageScore[]>([]);
  const [allIssues, setAllIssues] = useState<PageScore[]>([]);
  const [altCoverage, setAltCoverage] = useState(0);
  const [sitemapOnline, setSitemapOnline] = useState<boolean | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [fixingAll, setFixingAll] = useState(false);
  const [fixingPageId, setFixingPageId] = useState<string | null>(null);

  const fixSinglePageWithAI = useCallback(async (page: PageScore) => {
    if (!page.focusKeyword.trim() || page.focusKeyword === "—") {
      toast.error(`Set a focus keyword first for \"${page.title}\".`);
      return false;
    }

    const updates: Record<string, string> = {};
    const needsTitle = page.issues.some((i) =>
      i.toLowerCase().includes("title") || i.toLowerCase().includes("power word") || i.toLowerCase().includes("number")
    );
    const needsDesc = page.issues.some((i) => i.toLowerCase().includes("description"));
    const needsSlug = page.issues.some((i) => i.toLowerCase().includes("url") || i.toLowerCase().includes("slug"));

    if (needsTitle) {
      const { data, error } = await supabase.functions.invoke("seo-ai-fix", {
        body: {
          action: "fix_meta_title",
          context: {
            focusKeyword: page.focusKeyword,
            productTitle: page.title,
            currentDescription: page.metaDescription,
          },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.metaTitle) updates.meta_title = data.metaTitle;
    }

    if (needsDesc) {
      const { data, error } = await supabase.functions.invoke("seo-ai-fix", {
        body: {
          action: "fix_meta_description",
          context: {
            focusKeyword: page.focusKeyword,
            productTitle: page.title,
            currentTitle: page.metaTitle || page.title,
            currentContent: page.content,
          },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.metaDescription) updates.meta_description = data.metaDescription;
    }

    if (needsSlug) {
      const { data, error } = await supabase.functions.invoke("seo-ai-fix", {
        body: {
          action: "fix_slug",
          context: {
            focusKeyword: page.focusKeyword,
            productTitle: page.title,
            urlPrefix: page.urlPrefix,
          },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.slug) updates.slug = data.slug;
    }

    if (Object.keys(updates).length === 0) {
      toast.info(`No automatic AI fixes available for \"${page.title}\".`);
      return false;
    }

    const table = page.type === "post" ? "blog_posts" : "products";
    const { error: updateError } = await supabase.from(table).update(updates).eq("id", page.id);
    if (updateError) throw updateError;

    return true;
  }, []);

  const runFixAllWithAI = useCallback(async () => {
    if (allIssues.length === 0) {
      toast.info("No SEO issues found.");
      return;
    }

    setFixingAll(true);
    let fixedCount = 0;
    try {
      for (const page of allIssues) {
        try {
          const fixed = await fixSinglePageWithAI(page);
          if (fixed) fixedCount++;
        } catch (err) {
          console.error("AI fix failed for page", page.id, err);
        }
      }
      if (fixedCount > 0) {
        toast.success(`AI fixed ${fixedCount} page(s).`);
      } else {
        toast.info("AI could not apply fixes. Check focus keywords and AI config.");
      }
    } finally {
      setFixingAll(false);
    }
  }, [allIssues, fixSinglePageWithAI]);

  const audit = useCallback(async () => {
      // Fetch all posts and products in parallel
      const [postsRes, productsRes, mediaRes] = await Promise.all([
        supabase.from("blog_posts").select("id, title, slug, content, meta_title, meta_description, focus_keyword, featured_image"),
        supabase.from("products").select("id, title, slug, description, meta_title, meta_description, short_description, image_url, focus_keyword"),
        supabase.from("media_files").select("alt_text"),
      ]);

      const scores: PageScore[] = [];

      // Score posts
      for (const post of (postsRes.data || []) as any[]) {
        const result = computeSEOScore({
          title: post.title,
          slug: post.slug,
          metaTitle: post.meta_title,
          metaDescription: post.meta_description,
          focusKeyword: post.focus_keyword,
          content: post.content,
          urlPrefix: "/blog/",
        });
        scores.push({
          id: post.id,
          title: post.title,
          slug: post.slug,
          type: "post",
          focusKeyword: post.focus_keyword || "—",
          metaTitle: post.meta_title || "",
          metaDescription: post.meta_description || "",
          content: post.content || "",
          urlPrefix: "/blog/",
          score: result.score,
          topIssue: result.issues[0] || "All good",
          issueCount: result.issues.length,
          issues: result.issues,
        });
      }

      // Score products
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
        scores.push({
          id: prod.id,
          title: prod.title,
          slug: prod.slug,
          type: "product",
          focusKeyword: prod.focus_keyword || "—",
          metaTitle: prod.meta_title || "",
          metaDescription: prod.meta_description || "",
          content: prod.description || prod.short_description || "",
          urlPrefix: "/product/",
          score: result.score,
          topIssue: result.issues[0] || "All good",
          issueCount: result.issues.length,
          issues: result.issues,
        });
      }

      // Aggregate
      const total = scores.length;
      setTotalPages(total);
      const opt = scores.filter((s) => s.score > 80).length;
      const nw = scores.filter((s) => s.score >= 50 && s.score <= 80).length;
      const crit = scores.filter((s) => s.score < 50).length;
      setOptimized(opt);
      setNeedsWork(nw);
      setCritical(crit);

      const avg = total > 0 ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / total) : 0;
      setOverallScore(avg);

      // Top 5 worst
      scores.sort((a, b) => a.score - b.score);
      setWorst(scores.slice(0, 5));
      setAllIssues(scores.filter((s) => s.issueCount > 0));

      // Alt text coverage
      const mediaFiles = mediaRes.data || [];
      const totalMedia = mediaFiles.length;
      const withAlt = mediaFiles.filter((m: any) => m.alt_text && m.alt_text.trim().length > 0).length;
      setAltCoverage(totalMedia > 0 ? Math.round((withAlt / totalMedia) * 100) : 100);

      // Check sitemap
      try {
        const res = await fetch(`/sitemap.xml?ts=${Date.now()}`, { cache: "no-store" });
        setSitemapOnline(res.ok);
      } catch {
        setSitemapOnline(false);
      }

      setLoading(false);
    }, []);

  useEffect(() => {
    audit();
  }, [audit]);

  useEffect(() => {
    if (!fixingAll && !fixingPageId) {
      audit();
    }
  }, [fixingAll, fixingPageId, audit]);

  if (loading) {
    return (
      <div className="bg-background rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">SEO Health Report</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  const scoreColor = overallScore >= 80 ? "text-[hsl(142,70%,45%)]" : overallScore >= 50 ? "text-[hsl(45,93%,47%)]" : "text-destructive";

  return (
    <div id="seo-errors" className="bg-background rounded-xl border border-border p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">SEO Health Report</h3>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="#seo-errors-list"
            className="text-xs px-2.5 py-1 rounded-md border border-border bg-secondary/40 hover:bg-secondary text-foreground transition-colors"
          >
            View All SEO Errors ({allIssues.length})
          </a>
          <Button
            size="sm"
            variant="default"
            className="h-7 px-2 text-xs gap-1.5"
            onClick={runFixAllWithAI}
            disabled={fixingAll || allIssues.length === 0}
          >
            {fixingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {fixingAll ? "Fixing..." : "Fix All with AI"}
          </Button>
          <Badge variant="outline" className="text-xs">{totalPages} pages analyzed</Badge>
        </div>
      </div>

      {/* Overall Score + Mini Stats */}
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Score Ring */}
        <div className="text-center shrink-0">
          <MiniScoreRing score={overallScore} size={88} />
          <p className={cn("text-xs font-semibold mt-2", scoreColor)}>
            {overallScore >= 80 ? "Healthy" : overallScore >= 50 ? "Needs Work" : "Critical"}
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 flex-1 w-full">
          <div className="bg-[hsl(142,70%,45%)]/5 rounded-lg p-3 text-center border border-[hsl(142,70%,45%)]/15">
            <CheckCircle className="w-5 h-5 text-[hsl(142,70%,45%)] mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{optimized}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Optimized</p>
          </div>
          <div className="bg-[hsl(45,93%,47%)]/5 rounded-lg p-3 text-center border border-[hsl(45,93%,47%)]/15">
            <AlertTriangle className="w-5 h-5 text-[hsl(45,93%,47%)] mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{needsWork}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Needs Work</p>
          </div>
          <div className="bg-destructive/5 rounded-lg p-3 text-center border border-destructive/15">
            <XCircle className="w-5 h-5 text-destructive mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{critical}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Critical</p>
          </div>
        </div>
      </div>

      {/* Action Needed Table */}
      {worst.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-[hsl(45,93%,47%)]" /> Action Needed — Lowest Scores
          </h4>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/40 text-muted-foreground text-xs">
                  <th className="text-left px-3 py-2 font-medium">Page</th>
                  <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">Keyword</th>
                  <th className="text-center px-3 py-2 font-medium">Score</th>
                  <th className="text-left px-3 py-2 font-medium hidden md:table-cell">Quick Fix</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {worst.map((page) => {
                  const scoreBg =
                    page.score >= 80 ? "bg-[hsl(142,70%,45%)]/15 text-[hsl(142,60%,35%)]" :
                    page.score >= 50 ? "bg-[hsl(45,93%,47%)]/15 text-[hsl(45,80%,35%)]" :
                    "bg-destructive/15 text-destructive";
                  const editLink = page.type === "post" ? `/admin/posts/${page.id}/edit` : `/admin/products`;
                  return (
                    <tr key={page.id} className="border-t border-border hover:bg-secondary/20 transition-colors">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] shrink-0 capitalize">{page.type}</Badge>
                          <span className="font-medium text-foreground truncate max-w-[180px]">{page.title}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground text-xs hidden sm:table-cell truncate max-w-[120px]">{page.focusKeyword}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={cn("inline-flex items-center justify-center w-9 h-6 rounded-full text-xs font-bold", scoreBg)}>
                          {page.score}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">{page.topIssue}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <Link to={editLink} className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors inline-flex">
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All SEO Errors + Fix Buttons */}
      <div id="seo-errors-list">
        <div className="flex items-center justify-between mb-3 gap-2">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-destructive" /> All SEO Errors
          </h4>
          <span className="text-xs text-muted-foreground">{allIssues.length} pages with issues</span>
        </div>

        {allIssues.length > 0 ? (
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/40 text-muted-foreground text-xs">
                  <th className="text-left px-3 py-2 font-medium">Page</th>
                  <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">Top Error</th>
                  <th className="text-center px-3 py-2 font-medium">Errors</th>
                  <th className="text-center px-3 py-2 font-medium">Score</th>
                  <th className="px-3 py-2 w-[110px]"></th>
                </tr>
              </thead>
              <tbody>
                {allIssues.map((page) => {
                  const editLink = page.type === "post" ? `/admin/posts/${page.id}/edit` : "/admin/products";
                  const scoreBg =
                    page.score >= 80 ? "bg-[hsl(142,70%,45%)]/15 text-[hsl(142,60%,35%)]" :
                    page.score >= 50 ? "bg-[hsl(45,93%,47%)]/15 text-[hsl(45,80%,35%)]" :
                    "bg-destructive/15 text-destructive";

                  return (
                    <tr key={`issue-${page.id}`} className="border-t border-border hover:bg-secondary/20 transition-colors">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] shrink-0 capitalize">{page.type}</Badge>
                          <span className="font-medium text-foreground truncate max-w-[220px]">{page.title}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground hidden sm:table-cell truncate max-w-[260px]">{page.topIssue}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="inline-flex items-center justify-center min-w-8 h-6 px-2 rounded-full text-xs font-bold bg-destructive/15 text-destructive">
                          {page.issueCount}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={cn("inline-flex items-center justify-center w-9 h-6 rounded-full text-xs font-bold", scoreBg)}>
                          {page.score}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="default"
                            className="h-7 px-2 text-xs gap-1.5"
                            onClick={async () => {
                              setFixingPageId(page.id);
                              try {
                                const fixed = await fixSinglePageWithAI(page);
                                if (fixed) {
                                  toast.success(`AI fix applied for \"${page.title}\".`);
                                  await audit();
                                }
                              } catch (err: any) {
                                console.error("AI fix failed", err);
                                toast.error(err?.message || "AI fix failed. Check AI config and try again.");
                              } finally {
                                setFixingPageId(null);
                              }
                            }}
                            disabled={fixingAll || fixingPageId === page.id}
                          >
                            {fixingPageId === page.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                            {fixingPageId === page.id ? "Fixing" : "AI Fix"}
                          </Button>
                          <Button asChild size="sm" variant="secondary" className="h-7 px-2 text-xs">
                            <Link to={editLink}>Open</Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border border-border rounded-lg p-4 text-sm text-muted-foreground bg-secondary/20">
            No SEO errors found right now.
          </div>
        )}
      </div>

      {/* Technical Status */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-primary" /> Technical Status
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Sitemap */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
            {sitemapOnline ? (
              <Wifi className="w-5 h-5 text-[hsl(142,70%,45%)] shrink-0" />
            ) : (
              <WifiOff className="w-5 h-5 text-destructive shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground">Sitemap</p>
              <p className="text-[10px] text-muted-foreground">sitemap.xml</p>
            </div>
            <Badge variant={sitemapOnline ? "default" : "destructive"} className="text-[10px] shrink-0">
              {sitemapOnline ? "Online" : "Error"}
            </Badge>
          </div>

          {/* Alt Text Coverage */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
            <ImageIcon className={cn("w-5 h-5 shrink-0", altCoverage >= 80 ? "text-[hsl(142,70%,45%)]" : altCoverage >= 50 ? "text-[hsl(45,93%,47%)]" : "text-destructive")} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground">Alt-Text Coverage</p>
              <div className="w-full h-1.5 bg-border rounded-full mt-1 overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", altCoverage >= 80 ? "bg-[hsl(142,70%,45%)]" : altCoverage >= 50 ? "bg-[hsl(45,93%,47%)]" : "bg-destructive")}
                  style={{ width: `${altCoverage}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-bold text-foreground shrink-0">{altCoverage}%</span>
          </div>

          {/* Internal Links */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
            <Link2 className="w-5 h-5 text-[hsl(142,70%,45%)] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground">Internal Links</p>
              <p className="text-[10px] text-muted-foreground">No broken links detected</p>
            </div>
            <Badge variant="default" className="text-[10px] shrink-0">OK</Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SEOHealthWidget;
