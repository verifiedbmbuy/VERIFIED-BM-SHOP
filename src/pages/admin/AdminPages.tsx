import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash2, FileText, ExternalLink, Search, RefreshCw, Wand2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { computeSEOScore, getScoreBadgeClasses, SEOScoreResult } from "@/lib/seoScoring";
import SEOQuickFixPopup from "@/components/admin/SEOQuickFixPopup";

interface Page {
  id: string;
  title: string;
  slug: string;
  status: string;
  updated_at: string;
  meta_title: string | null;
  meta_description: string | null;
  content: string | null;
  focus_keyword: string | null;
}

const PAGE_ROUTE_MAP: Record<string, string> = {
  "verified-bm": "/",
  "verifiedbm": "/",
  "about-us": "/about",
  "contact-us": "/contact",
  "shop": "/shop",
  "faq": "/faq",
  "verified-business-manager-blog": "/blog",
  "privacy-policy": "/privacy",
  "refund-policy": "/refund-policy",
  "replacement-guarantee": "/replacement-guarantee",
  "terms-of-service": "/terms",
};

const AdminPages = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const fetchPages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pages")
      .select("id, title, slug, status, updated_at, meta_title, meta_description, content, focus_keyword")
      .order("created_at", { ascending: true });
    if (error) toast.error(`Failed to load pages: ${error.message}`);
    else setPages((data || []) as Page[]);
    setLoading(false);
  };

  useEffect(() => { fetchPages(); }, []);

  // SEO scoring
  const [seoPopup, setSeoPopup] = useState<{ page: Page; result: SEOScoreResult } | null>(null);
  const [bulkScanning, setBulkScanning] = useState(false);

  const seoScores = useMemo(() => {
    const map = new Map<string, SEOScoreResult>();
    pages.forEach((p) => {
      const route = PAGE_ROUTE_MAP[p.slug];
      const pageFullUrl = route ? `https://verifiedbm.shop${route}` : undefined;
      const prefix = route ? (route === "/" ? "/" : `${route}/`) : `/page/${p.slug}/`;
      map.set(p.id, computeSEOScore({
        title: p.title,
        slug: p.slug,
        metaTitle: p.meta_title,
        metaDescription: p.meta_description,
        focusKeyword: p.focus_keyword,
        content: p.content,
        urlPrefix: prefix,
        fullUrl: pageFullUrl,
      }));
    });
    return map;
  }, [pages]);

  const bulkAIScan = async () => {
    setBulkScanning(true);
    let fixCount = 0;
    for (const p of pages) {
      const result = seoScores.get(p.id);
      if (!result || result.score >= 80) continue;
      try {
        const updates: Record<string, any> = {};
        if (result.issues.some((i) => i.includes("description"))) {
          const { data } = await supabase.functions.invoke("seo-ai-fix", {
            body: { action: "fix_meta_description", context: { focusKeyword: result.focusKeyword || p.title, productTitle: p.title } },
          });
          if (data?.metaDescription) updates.meta_description = data.metaDescription;
        }
        if (result.issues.some((i) => i.includes("title"))) {
          const { data } = await supabase.functions.invoke("seo-ai-fix", {
            body: { action: "fix_meta_title", context: { focusKeyword: result.focusKeyword || p.title, productTitle: p.title } },
          });
          if (data?.metaTitle) updates.meta_title = data.metaTitle;
        }
        if (Object.keys(updates).length > 0) {
          await supabase.from("pages").update(updates).eq("id", p.id);
          fixCount++;
        }
      } catch { /* skip */ }
    }
    toast.success(`AI scan complete. Fixed ${fixCount} page(s).`);
    setBulkScanning(false);
    fetchPages();
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return pages;
    const q = search.toLowerCase();
    return pages.filter(
      (p) => p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q) || p.status.toLowerCase().includes(q)
    );
  }, [pages, search]);

  const deletePage = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("pages").delete().eq("id", id);
    if (error) toast.error(`Failed to delete: ${error.message}`);
    else { toast.success("Page deleted."); fetchPages(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Pages</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={bulkAIScan} disabled={bulkScanning} className="gap-1.5">
            {bulkScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
            AI Scan All
          </Button>
          <Button variant="outline" size="sm" onClick={fetchPages} className="gap-1.5" disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button onClick={() => navigate("/admin/pages/new")} className="gap-2">
            <Plus className="w-4 h-4" /> New Page
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search pages by title, slug, or status…"
          className="pl-9"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {pages.length} pages (all statuses)
      </p>

      <div className="bg-background rounded-xl border border-border">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {pages.length === 0 ? "No pages yet" : "No pages match your search"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {pages.length === 0 ? "Create your first page to get started." : "Try a different search term."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((page) => (
              <div key={page.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground text-sm truncate">{page.title}</span>
                    <Badge variant={page.status === "published" ? "default" : "secondary"} className="text-xs capitalize">
                      {page.status}
                    </Badge>
                    {(() => {
                      const result = seoScores.get(page.id);
                      if (!result) return null;
                      return (
                        <button
                          onClick={() => setSeoPopup({ page, result })}
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold cursor-pointer transition-colors hover:opacity-80 ${getScoreBadgeClasses(result.score)}`}
                          title="Click to quick-fix SEO"
                        >
                          SEO {result.score}
                        </button>
                      );
                    })()}
                  </div>
                  <span className="text-xs text-muted-foreground">/{page.slug} · Updated {format(new Date(page.updated_at), "MMM d, yyyy")}</span>
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <button
                    onClick={() => navigate(`/admin/pages/${page.id}/edit`)}
                    className="p-2 rounded text-primary text-xs font-medium hover:bg-primary/10 transition-colors"
                    title="Edit in Admin"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      const basePath = PAGE_ROUTE_MAP[page.slug] || `/page/${page.slug}`;
                      navigate(`${basePath}?edit=true`);
                    }}
                    className="p-2 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    title="Visual Edit"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deletePage(page.id, page.title)}
                    className="p-2 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SEO Quick Fix Popup */}
      {seoPopup && (
        <SEOQuickFixPopup
          itemTitle={seoPopup.page.title}
          seoResult={seoPopup.result}
          onClose={() => setSeoPopup(null)}
          onFixed={async (updates) => {
            await supabase.from("pages").update(updates).eq("id", seoPopup.page.id);
            setSeoPopup(null);
            fetchPages();
          }}
        />
      )}
    </div>
  );
};

export default AdminPages;
