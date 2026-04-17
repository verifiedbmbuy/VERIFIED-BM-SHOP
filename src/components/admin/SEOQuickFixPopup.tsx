import { useState } from "react";
import { X, Wand2, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SEOScoreResult, getScoreBadgeClasses } from "@/lib/seoScoring";

interface SEOQuickFixPopupProps {
  itemTitle: string;
  seoResult: SEOScoreResult;
  onClose: () => void;
  onFixed: (updates: {
    meta_title?: string;
    meta_description?: string;
    slug?: string;
    focus_keyword?: string;
  }) => void;
}

const SEOQuickFixPopup = ({ itemTitle, seoResult, onClose, onFixed }: SEOQuickFixPopupProps) => {
  const [fixing, setFixing] = useState(false);
  const [fixedIssues, setFixedIssues] = useState<Set<string>>(new Set());

  const fixAll = async () => {
    if (!seoResult.focusKeyword && seoResult.issues.includes("No focus keyword")) {
      toast.error("Set a focus keyword first before fixing.");
      return;
    }
    setFixing(true);
    try {
      const updates: Record<string, string> = {};
      const needsTitle = seoResult.issues.some((i) =>
        i.includes("title") || i.includes("power word") || i.includes("number")
      );
      const needsDesc = seoResult.issues.some((i) => i.includes("description") || i.includes("Description"));
      const needsSlug = seoResult.issues.some((i) => i.includes("URL") || i.includes("Keyword not in URL"));

      const promises: Promise<void>[] = [];

      if (needsTitle) {
        promises.push(
          supabase.functions.invoke("seo-ai-fix", {
            body: {
              action: "fix_meta_title",
              context: { focusKeyword: seoResult.focusKeyword, productTitle: itemTitle },
            },
          }).then(({ data }) => {
            if (data?.metaTitle) updates.meta_title = data.metaTitle;
          })
        );
      }

      if (needsDesc) {
        promises.push(
          supabase.functions.invoke("seo-ai-fix", {
            body: {
              action: "fix_meta_description",
              context: { focusKeyword: seoResult.focusKeyword, productTitle: itemTitle, currentTitle: itemTitle },
            },
          }).then(({ data }) => {
            if (data?.metaDescription) updates.meta_description = data.metaDescription;
          })
        );
      }

      if (needsSlug) {
        promises.push(
          supabase.functions.invoke("seo-ai-fix", {
            body: {
              action: "fix_slug",
              context: { focusKeyword: seoResult.focusKeyword, productTitle: itemTitle },
            },
          }).then(({ data }) => {
            if (data?.slug) updates.slug = data.slug;
          })
        );
      }

      await Promise.all(promises);

      if (Object.keys(updates).length > 0) {
        onFixed(updates);
        setFixedIssues(new Set(seoResult.issues));
        toast.success(`Fixed ${Object.keys(updates).length} SEO field(s)!`);
      } else {
        toast.info("No automatic fixes available for remaining issues.");
      }
    } catch (e) {
      toast.error("AI fix failed. Try again.");
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-background border border-border rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-foreground text-sm">SEO Quick Fix</h3>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[280px]">{itemTitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-lg font-bold px-2.5 py-0.5 rounded-md border ${getScoreBadgeClasses(seoResult.score)}`}>
              {seoResult.score}
            </span>
            <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Issues List */}
        <div className="px-5 py-4 space-y-2 max-h-[300px] overflow-y-auto">
          {seoResult.issues.length === 0 ? (
            <div className="text-center py-4">
              <CheckCircle className="w-8 h-8 text-[hsl(142,70%,45%)] mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">All checks passed!</p>
            </div>
          ) : (
            seoResult.issues.map((issue, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                {fixedIssues.has(issue) ? (
                  <CheckCircle className="w-4 h-4 text-[hsl(142,70%,45%)] shrink-0 mt-0.5" />
                ) : issue.includes("No focus") ? (
                  <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-[hsl(45,93%,47%)] shrink-0 mt-0.5" />
                )}
                <span className={fixedIssues.has(issue) ? "line-through text-muted-foreground" : "text-foreground"}>
                  {issue}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Details */}
        <div className="px-5 py-3 border-t border-border bg-muted/30 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Focus Keyword</span>
            <span className="text-foreground font-medium">{seoResult.focusKeyword || "—"}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">URL Length</span>
            <span className={`font-medium ${seoResult.urlExceeds75 ? "text-destructive" : "text-foreground"}`}>
              {seoResult.urlLength} chars {seoResult.urlExceeds75 ? "(>75)" : ""}
            </span>
          </div>
        </div>

        {/* Actions */}
        {seoResult.issues.length > 0 && (
          <div className="px-5 py-4 border-t border-border">
            <Button onClick={fixAll} disabled={fixing} className="w-full gap-2" size="sm">
              {fixing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {fixing ? "Fixing…" : "Fix All with AI"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SEOQuickFixPopup;
