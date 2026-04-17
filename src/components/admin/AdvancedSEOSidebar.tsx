import { useMemo, useState } from "react";
import { CheckCircle, AlertCircle, XCircle, TrendingUp, ChevronDown, ChevronUp, Search, Wand2, Loader2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ── Types ── */
export interface SEOCheckResult {
  id: string;
  label: string;
  status: "good" | "warning" | "error";
  detail: string;
  fixAction?: string; // AI action to call
}

export interface AdvancedSEOData {
  focusKeyword: string;
  metaTitle: string;
  metaDescription: string;
  slug: string;
  content: string;
  postTitle: string;
  featuredImageAlt?: string;
  urlPrefix?: string;
}

/* ── Helpers ── */
const stripHtml = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const countWords = (text: string) => { const c = stripHtml(text); return c ? c.split(/\s+/).length : 0; };
const getHeadings = (html: string): string[] => {
  const m = html.match(/<h[23][^>]*>(.*?)<\/h[23]>/gi) || [];
  return m.map((x) => stripHtml(x).toLowerCase());
};

const POWER_WORDS = [
  "best", "top", "proven", "ultimate", "exclusive", "premium", "instant",
  "guaranteed", "secure", "trusted", "verified", "powerful", "essential",
  "secret", "free", "limited", "official", "professional", "expert",
  "fastest", "cheapest", "reliable", "safe", "legit", "authentic",
  "unbeatable", "incredible", "amazing", "boost", "hack", "guide",
];

const POSITIVE_WORDS = [
  "best", "top", "great", "amazing", "excellent", "premium", "trusted",
  "reliable", "secure", "guaranteed", "proven", "fast", "instant",
  "professional", "official", "safe", "verified", "authentic", "easy",
];
const NEGATIVE_WORDS = [
  "worst", "bad", "terrible", "avoid", "scam", "fake", "danger",
  "risky", "never", "fail", "broken", "warning", "beware", "stop",
];

/* ── Audit Engine ── */
export function runAdvancedSEOAudit(data: AdvancedSEOData): { score: number; checks: SEOCheckResult[] } {
  const checks: SEOCheckResult[] = [];
  const kw = data.focusKeyword?.toLowerCase().trim();
  const plainText = stripHtml(data.content);
  const wordCount = countWords(data.content);
  const title = (data.metaTitle || data.postTitle || "").toLowerCase();
  const fullTitle = data.metaTitle || data.postTitle || "";
  const prefix = data.urlPrefix || "/product/";

  // 1. Focus Keyword in SEO Title
  if (!kw) {
    checks.push({ id: "kw-title", label: "Keyword in SEO Title", status: "error", detail: "Set a focus keyword first." });
  } else if (title.startsWith(kw)) {
    checks.push({ id: "kw-title", label: "Keyword in SEO Title", status: "good", detail: "Keyword at the beginning of the title." });
  } else if (title.includes(kw)) {
    checks.push({ id: "kw-title", label: "Keyword in SEO Title", status: "warning", detail: "Found but not at the start. Move it forward.", fixAction: "fix_meta_title" });
  } else {
    checks.push({ id: "kw-title", label: "Keyword in SEO Title", status: "error", detail: "Keyword not in the SEO title.", fixAction: "fix_meta_title" });
  }

  // 2. Keyword in Meta Description
  if (!kw) {
    checks.push({ id: "kw-meta", label: "Keyword in Meta Description", status: "error", detail: "Set a focus keyword." });
  } else if (data.metaDescription.toLowerCase().includes(kw)) {
    checks.push({ id: "kw-meta", label: "Keyword in Meta Description", status: "good", detail: "Found in description." });
  } else {
    checks.push({ id: "kw-meta", label: "Keyword in Meta Description", status: "error", detail: "Add keyword to the meta description.", fixAction: "fix_meta_description" });
  }

  // 3. Keyword in URL
  if (!kw) {
    checks.push({ id: "kw-url", label: "Keyword in URL", status: "error", detail: "Set a focus keyword." });
  } else {
    const kwSlug = kw.replace(/\s+/g, "-");
    if (data.slug.toLowerCase().includes(kwSlug) || data.slug.toLowerCase().includes(kw.replace(/\s+/g, ""))) {
      checks.push({ id: "kw-url", label: "Keyword in URL", status: "good", detail: "Keyword appears in the slug." });
    } else {
      checks.push({ id: "kw-url", label: "Keyword in URL", status: "error", detail: "Include keyword in the URL slug.", fixAction: "fix_slug" });
    }
  }

  // 4. Keyword in first 10% of content
  if (kw && plainText) {
    const tenPercent = plainText.substring(0, Math.ceil(plainText.length * 0.1)).toLowerCase();
    if (tenPercent.includes(kw)) {
      checks.push({ id: "kw-intro", label: "Keyword in first 10% of content", status: "good", detail: "Found early in the content." });
    } else {
      checks.push({ id: "kw-intro", label: "Keyword in first 10% of content", status: "warning", detail: "Add the keyword in the opening paragraph.", fixAction: "fix_content_intro" });
    }
  }

  // 5. Keyword in H2/H3 subheadings (includes page title H1 + template-rendered headings)
  if (kw) {
    const contentHeadings = getHeadings(data.content);
    // Also count the page title (rendered as H1) as a heading source
    const allHeadings = [...contentHeadings, data.postTitle.toLowerCase()];
    const kwH = allHeadings.filter((h) => h.includes(kw));
    if (kwH.length >= 2) checks.push({ id: "kw-headings", label: "Keyword in headings", status: "good", detail: `Found in ${kwH.length} headings (H1/H2/H3).` });
    else if (kwH.length === 1) checks.push({ id: "kw-headings", label: "Keyword in headings", status: "good", detail: "Found in 1 heading (page title or subheading)." });
    else checks.push({ id: "kw-headings", label: "Keyword in headings", status: "error", detail: "Not found in any heading.", fixAction: "suggest_headings" });
  }

  // 6. Image alt text with keyword
  const imgMatches = data.content.match(/<img[^>]*>/gi) || [];
  const hasImages = imgMatches.length > 0 || data.featuredImageAlt;
  if (!hasImages) {
    checks.push({ id: "img-alt", label: "Image with keyword alt text", status: "warning", detail: "No images found. Add at least one." });
  } else if (kw) {
    const altTexts = imgMatches.map((m) => {
      const alt = m.match(/alt=["']([^"']*)["']/i);
      return alt ? alt[1].toLowerCase() : "";
    });
    if (data.featuredImageAlt) altTexts.push(data.featuredImageAlt.toLowerCase());
    if (altTexts.some((a) => a.includes(kw))) {
      checks.push({ id: "img-alt", label: "Image with keyword alt text", status: "good", detail: "At least one image alt contains the keyword." });
    } else {
      checks.push({ id: "img-alt", label: "Image with keyword alt text", status: "warning", detail: "Add keyword to at least one image alt.", fixAction: "fix_alt_text" });
    }
  }

  // 7. Keyword density
  if (kw && wordCount > 0) {
    const kwRegex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const kwCount = (plainText.match(kwRegex) || []).length;
    const density = (kwCount / wordCount) * 100;
    if (density >= 1.0 && density <= 1.5) {
      checks.push({ id: "kw-density", label: "Keyword density (1.0–1.5%)", status: "good", detail: `${density.toFixed(1)}% — optimal.` });
    } else if (density >= 0.5 && density < 1.0) {
      checks.push({ id: "kw-density", label: "Keyword density (1.0–1.5%)", status: "warning", detail: `${density.toFixed(1)}% — slightly low. Aim for 1.0–1.5%.` });
    } else if (density > 1.5 && density <= 2.5) {
      checks.push({ id: "kw-density", label: "Keyword density (1.0–1.5%)", status: "warning", detail: `${density.toFixed(1)}% — slightly high.` });
    } else if (density > 2.5) {
      checks.push({ id: "kw-density", label: "Keyword density (1.0–1.5%)", status: "error", detail: `${density.toFixed(1)}% — keyword stuffing risk.` });
    } else {
      checks.push({ id: "kw-density", label: "Keyword density (1.0–1.5%)", status: "error", detail: `${density.toFixed(1)}% — too low or missing.` });
    }
  }

  // 8. Content length
  if (wordCount > 600) checks.push({ id: "content-len", label: "Content length", status: "good", detail: `${wordCount} words — great.` });
  else if (wordCount >= 300) checks.push({ id: "content-len", label: "Content length", status: "warning", detail: `${wordCount} words — aim for 600+.` });
  else checks.push({ id: "content-len", label: "Content length", status: "error", detail: `${wordCount} words — too short.` });

  // 9. Title length
  const titleLen = fullTitle.length;
  if (titleLen > 0 && titleLen <= 60) checks.push({ id: "title-len", label: "SEO title length", status: "good", detail: `${titleLen}/60 chars.` });
  else if (titleLen > 60) checks.push({ id: "title-len", label: "SEO title length", status: "warning", detail: `${titleLen}/60 — may be truncated.`, fixAction: "fix_meta_title" });
  else checks.push({ id: "title-len", label: "SEO title length", status: "error", detail: "No title set.", fixAction: "fix_meta_title" });

  // 10. Meta description length
  const descLen = data.metaDescription.length;
  if (descLen >= 120 && descLen <= 160) checks.push({ id: "meta-len", label: "Meta description length", status: "good", detail: `${descLen}/160 — ideal.` });
  else if (descLen > 0 && descLen < 120) checks.push({ id: "meta-len", label: "Meta description length", status: "warning", detail: `${descLen}/160 — aim for 120–160.`, fixAction: "fix_meta_description" });
  else if (descLen > 160) checks.push({ id: "meta-len", label: "Meta description length", status: "warning", detail: `${descLen}/160 — too long.`, fixAction: "fix_meta_description" });
  else checks.push({ id: "meta-len", label: "Meta description length", status: "error", detail: "No meta description.", fixAction: "fix_meta_description" });

  // 11. Power word in title
  const titleWords = fullTitle.toLowerCase().split(/\s+/);
  const hasPowerWord = titleWords.some((w) => POWER_WORDS.includes(w));
  if (hasPowerWord) {
    checks.push({ id: "power-word", label: "Power word in title", status: "good", detail: "Title contains a power word for CTR." });
  } else {
    checks.push({ id: "power-word", label: "Power word in title", status: "warning", detail: "Add a power word (Best, Ultimate, Proven…).", fixAction: "suggest_titles" });
  }

  // 12. Number in title
  const hasNumber = /\d/.test(fullTitle);
  if (hasNumber) {
    checks.push({ id: "number-title", label: "Number in title", status: "good", detail: "Title contains a number — boosts CTR." });
  } else {
    checks.push({ id: "number-title", label: "Number in title", status: "warning", detail: "Add a number (e.g. '5 Best…', '2025 Guide').", fixAction: "suggest_titles" });
  }

  // 13. Sentiment analysis
  const posCount = titleWords.filter((w) => POSITIVE_WORDS.includes(w)).length;
  const negCount = titleWords.filter((w) => NEGATIVE_WORDS.includes(w)).length;
  if (posCount > 0 && negCount === 0) {
    checks.push({ id: "sentiment", label: "Title sentiment", status: "good", detail: "Positive sentiment detected — attracts clicks." });
  } else if (negCount > 0 && posCount === 0) {
    checks.push({ id: "sentiment", label: "Title sentiment", status: "warning", detail: "Negative sentiment. Consider a positive angle.", fixAction: "suggest_titles" });
  } else if (posCount > 0 && negCount > 0) {
    checks.push({ id: "sentiment", label: "Title sentiment", status: "warning", detail: "Mixed sentiment. Keep it clear and positive.", fixAction: "suggest_titles" });
  } else {
    checks.push({ id: "sentiment", label: "Title sentiment", status: "warning", detail: "Neutral. Add emotional words for more CTR.", fixAction: "suggest_titles" });
  }

  // 14. Slug length
  const fullSlug = `https://verifiedbm.shop${prefix}${data.slug}`;
  if (fullSlug.length > 75) {
    checks.push({ id: "slug-len", label: "URL length", status: "warning", detail: `${fullSlug.length} chars — over 75. Shorten the slug.`, fixAction: "fix_slug" });
  } else {
    checks.push({ id: "slug-len", label: "URL length", status: "good", detail: `${fullSlug.length} chars — concise URL.` });
  }

  // 15. Readability
  const sentences = plainText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgSentenceLen = sentences.length > 0 ? Math.round(plainText.split(/\s+/).length / sentences.length) : 0;
  if (sentences.length === 0) {
    checks.push({ id: "readability", label: "Readability", status: "error", detail: "No content to analyze." });
  } else if (avgSentenceLen <= 20) {
    checks.push({ id: "readability", label: "Readability", status: "good", detail: `Avg ${avgSentenceLen} words/sentence — easy to read.` });
  } else if (avgSentenceLen <= 25) {
    checks.push({ id: "readability", label: "Readability", status: "warning", detail: `Avg ${avgSentenceLen} words/sentence — shorten some.` });
  } else {
    checks.push({ id: "readability", label: "Readability", status: "error", detail: `Avg ${avgSentenceLen} words/sentence — too long.` });
  }

  // Score
  const total = checks.length;
  const good = checks.filter((c) => c.status === "good").length;
  const warn = checks.filter((c) => c.status === "warning").length;
  const score = Math.round(((good * 1 + warn * 0.5) / total) * 100);

  return { score, checks };
}

/* ── Score Ring ── */
const ScoreRing = ({ score }: { score: number }) => {
  const r = 36, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "hsl(142,70%,45%)" : score >= 50 ? "hsl(45,93%,47%)" : "hsl(0,84%,60%)";
  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} className="transition-all duration-500" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{score}</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">/ 100</span>
      </div>
    </div>
  );
};

const statusIcon = (s: "good" | "warning" | "error") => {
  if (s === "good") return <CheckCircle className="w-4 h-4 text-[hsl(142,70%,45%)] shrink-0" />;
  if (s === "warning") return <AlertCircle className="w-4 h-4 text-[hsl(45,93%,47%)] shrink-0" />;
  return <XCircle className="w-4 h-4 text-destructive shrink-0" />;
};

/* ── Props ── */
interface AdvancedSEOSidebarProps {
  data: AdvancedSEOData;
  focusKeyword: string;
  metaTitle: string;
  metaDescription: string;
  onFocusKeywordChange: (v: string) => void;
  onMetaTitleChange: (v: string) => void;
  onMetaDescriptionChange: (v: string) => void;
  onSlugChange?: (v: string) => void;
  onContentChange?: (v: string) => void;
}

const AdvancedSEOSidebar = ({
  data, focusKeyword, metaTitle, metaDescription,
  onFocusKeywordChange, onMetaTitleChange, onMetaDescriptionChange,
  onSlugChange, onContentChange,
}: AdvancedSEOSidebarProps) => {
  const auditData = useMemo(() => ({ ...data, focusKeyword, metaTitle, metaDescription }), [data, focusKeyword, metaTitle, metaDescription]);
  const { score, checks } = useMemo(() => runAdvancedSEOAudit(auditData), [auditData]);

  const [section, setSection] = useState<"basic" | "content" | "title" | "advanced">("basic");
  const [fixingId, setFixingId] = useState<string | null>(null);
  const [titleSuggestions, setTitleSuggestions] = useState<string[] | null>(null);
  const [headingSuggestions, setHeadingSuggestions] = useState<string[] | null>(null);

  const errors = checks.filter((c) => c.status === "error");
  const warnings = checks.filter((c) => c.status === "warning");
  const goods = checks.filter((c) => c.status === "good");

  const basicIds = ["kw-title", "kw-meta", "kw-url", "kw-intro"];
  const contentIds = ["kw-headings", "img-alt", "kw-density", "content-len", "readability"];
  const titleIds = ["title-len", "meta-len", "power-word", "number-title", "sentiment"];
  const advancedIds = ["slug-len"];

  const filterChecks = (ids: string[]) => checks.filter((c) => ids.includes(c.id));

  const sectionData = [
    { key: "basic" as const, label: "Basic SEO", ids: basicIds },
    { key: "content" as const, label: "Content & Images", ids: contentIds },
    { key: "title" as const, label: "Title & Readability", ids: titleIds },
    { key: "advanced" as const, label: "Branded URL", ids: advancedIds },
  ];

  const callAIFixInternal = async (action: string, context: Record<string, any>) => {
    const { data: result, error } = await supabase.functions.invoke("seo-ai-fix", {
      body: { action, context },
    });

    if (error) throw error;
    if (result?.error) throw new Error(result.error);

    // Apply fixes based on action
    if (action === "fix_meta_description" && result?.metaDescription) {
      onMetaDescriptionChange(result.metaDescription);
    } else if (action === "fix_meta_title" && result?.metaTitle) {
      onMetaTitleChange(result.metaTitle);
    } else if (action === "fix_slug" && result?.slug) {
      if (onSlugChange) onSlugChange(result.slug);
    } else if (action === "suggest_titles" && result?.titles) {
      setTitleSuggestions(result.titles);
    } else if (action === "suggest_headings" && result?.headings) {
      setHeadingSuggestions(result.headings);
    } else if (action === "fix_content_intro" && result?.introText) {
      if (onContentChange) onContentChange(result.introText);
    } else if (action === "fix_alt_text" && result?.altText) {
      toast.info(`Suggested alt text: "${result.altText}" — update in Media Library.`);
    }

    return result;
  };

  const getAIContext = () => ({
    focusKeyword,
    currentTitle: metaTitle,
    currentDescription: metaDescription,
    currentSlug: data.slug,
    currentContent: data.content,
    productTitle: data.postTitle,
    urlPrefix: data.urlPrefix,
  });

  const callAIFix = async (action: string, checkId: string) => {
    if (!focusKeyword.trim()) {
      toast.error("Set a focus keyword first.");
      return;
    }

    setFixingId(checkId);
    try {
      await callAIFixInternal(action, getAIContext());
      toast.success("AI fix applied!");
    } catch (err: any) {
      console.error("AI fix error:", err);
      toast.error("AI fix failed. Try again.");
    } finally {
      setFixingId(null);
    }
  };

  const fixAllErrors = async () => {
    const fixable = checks.filter((c) => c.status !== "good" && c.fixAction);
    if (fixable.length === 0) { toast.info("Nothing to fix!"); return; }
    if (!focusKeyword.trim()) { toast.error("Set a focus keyword first."); return; }

    setFixingId("fix-all");
    let fixed = 0;
    try {
      for (const check of fixable) {
        try {
          await callAIFixInternal(check.fixAction!, getAIContext());
          fixed++;
          // Yield to UI thread between fixes
          await new Promise((resolve) => setTimeout(resolve, 50));
        } catch {
          // Skip individual failures
        }
      }
      toast.success(`Fixed ${fixed}/${fixable.length} issues!`);
    } finally {
      setFixingId(null);
    }
  };

  return (
    <div className="bg-background rounded-xl border border-border p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">SEO Analysis</h3>
        <span className={cn(
          "ml-auto text-xs font-bold px-2 py-0.5 rounded-full",
          score >= 80 ? "bg-[hsl(142,70%,45%)]/10 text-[hsl(142,70%,45%)]" :
          score >= 50 ? "bg-[hsl(45,93%,47%)]/10 text-[hsl(45,80%,35%)]" :
          "bg-destructive/10 text-destructive"
        )}>{score}/100</span>
      </div>

      <ScoreRing score={score} />

      <p className="text-center text-xs text-muted-foreground">
        {score >= 80 ? "Great! Well optimized." :
         score >= 50 ? "Decent. Address warnings below." :
         "Needs work. Fix the errors below."}
      </p>

      {/* Fix All Button */}
      {(errors.length > 0 || warnings.length > 0) && (
        <Button
          onClick={fixAllErrors}
          disabled={fixingId === "fix-all" || !focusKeyword.trim()}
          size="sm"
          className="w-full gap-2 bg-gradient-to-r from-primary to-[hsl(280,80%,55%)] hover:opacity-90 text-white"
        >
          {fixingId === "fix-all" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Fix All with AI ({errors.length + warnings.filter(w => w.fixAction).length} issues)
        </Button>
      )}

      {/* Focus Keyword Input */}
      <div>
        <label className="text-xs font-medium text-foreground mb-1 block">Focus Keyword</label>
        <Input
          value={focusKeyword}
          onChange={(e) => onFocusKeywordChange(e.target.value)}
          placeholder="e.g. verified business manager"
          className="text-sm h-8"
        />
      </div>

      {/* Meta Title */}
      <div>
        <label className="text-xs font-medium text-foreground mb-1 block">SEO Title</label>
        <Input
          value={metaTitle}
          onChange={(e) => onMetaTitleChange(e.target.value)}
          placeholder={data.postTitle || "SEO title…"}
          maxLength={60}
          className="text-sm h-8"
        />
        <p className="text-[10px] text-muted-foreground mt-0.5">{(metaTitle || "").length}/60</p>
      </div>

      {/* Meta Description */}
      <div>
        <label className="text-xs font-medium text-foreground mb-1 block">Meta Description</label>
        <Textarea
          value={metaDescription}
          onChange={(e) => onMetaDescriptionChange(e.target.value)}
          placeholder="Write a concise summary…"
          rows={2}
          className="text-sm"
        />
        <p className={cn("text-[10px] mt-0.5", metaDescription.length > 150 ? "text-destructive" : "text-muted-foreground")}>
          {metaDescription.length}/160
        </p>
      </div>

      {/* Google Preview */}
      <div className="bg-secondary/40 rounded-lg p-3 space-y-0.5">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Google Preview</p>
        <p className="text-[hsl(217,89%,61%)] text-sm font-medium leading-tight truncate">
          {(metaTitle || data.postTitle || "Untitled").slice(0, 60)} | Verified BM Shop
        </p>
        <p className="text-[hsl(142,70%,45%)] text-[11px] truncate">
          verifiedbm.shop{data.urlPrefix || "/product/"}{data.slug || "…"}
        </p>
        <p className="text-[11px] text-muted-foreground line-clamp-2">
          {(metaDescription || "Add a meta description to improve visibility.").slice(0, 160)}
        </p>
      </div>

      {/* Title Suggestions */}
      {titleSuggestions && (
        <div className="bg-primary/5 rounded-lg p-3 space-y-2 border border-primary/20">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> AI Title Suggestions
            </p>
            <button onClick={() => setTitleSuggestions(null)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
          </div>
          {titleSuggestions.map((t, i) => (
            <button
              key={i}
              onClick={() => { onMetaTitleChange(t); setTitleSuggestions(null); toast.success("Title applied!"); }}
              className="w-full text-left text-xs p-2 rounded-md bg-background border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Heading Suggestions */}
      {headingSuggestions && (
        <div className="bg-primary/5 rounded-lg p-3 space-y-2 border border-primary/20">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> Suggested H2 Headings
            </p>
            <button onClick={() => setHeadingSuggestions(null)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
          </div>
          {headingSuggestions.map((h, i) => (
            <div key={i} className="text-xs p-2 rounded-md bg-background border border-border">
              <code className="text-primary font-mono">&lt;h2&gt;</code> {h} <code className="text-primary font-mono">&lt;/h2&gt;</code>
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground">Copy these headings into your content.</p>
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex gap-1 flex-wrap">
        {sectionData.map((s) => {
          const sChecks = filterChecks(s.ids);
          const sErrors = sChecks.filter((c) => c.status === "error").length;
          const sGoods = sChecks.filter((c) => c.status === "good").length;
          return (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              className={cn(
                "text-[10px] px-2 py-1 rounded-md font-medium transition-colors",
                section === s.key ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-muted-foreground hover:text-foreground"
              )}
            >
              {s.label}
              {sErrors > 0 && <span className="ml-1 text-destructive">•</span>}
              {sErrors === 0 && sGoods === sChecks.length && <span className="ml-1 text-[hsl(142,70%,45%)]">✓</span>}
            </button>
          );
        })}
      </div>

      {/* Checklist */}
      <div className="space-y-1.5">
        {filterChecks(sectionData.find((s) => s.key === section)!.ids).map((c) => (
          <div key={c.id} className={cn(
            "flex items-start gap-2 p-2 rounded-lg",
            c.status === "good" ? "bg-[hsl(142,70%,45%)]/5" :
            c.status === "warning" ? "bg-[hsl(45,93%,47%)]/5" :
            "bg-destructive/5"
          )}>
            {statusIcon(c.status)}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground">{c.label}</p>
              <p className="text-[11px] text-muted-foreground">{c.detail}</p>
            </div>
            {c.fixAction && c.status !== "good" && (
              <button
                onClick={() => callAIFix(c.fixAction!, c.id)}
                disabled={!!fixingId}
                className={cn(
                  "shrink-0 flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md transition-colors",
                  "bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50"
                )}
                title="Fix with AI"
              >
                {fixingId === c.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Wand2 className="w-3 h-3" />
                )}
                Fix
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1 border-t border-border">
        <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-[hsl(142,70%,45%)]" /> {goods.length} passed</span>
        <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-[hsl(45,93%,47%)]" /> {warnings.length} warnings</span>
        <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-destructive" /> {errors.length} errors</span>
      </div>
    </div>
  );
};

export default AdvancedSEOSidebar;
