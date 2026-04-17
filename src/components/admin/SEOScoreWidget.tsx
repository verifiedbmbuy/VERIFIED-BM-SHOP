import { useMemo } from "react";
import { CheckCircle, AlertCircle, XCircle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SEOCheckResult {
  id: string;
  label: string;
  status: "good" | "warning" | "error";
  detail: string;
}

export interface SEOAuditData {
  focusKeyword: string;
  metaTitle: string;
  metaDescription: string;
  slug: string;
  content: string; // HTML content
  postTitle: string;
  featuredImageAlt?: string;
}

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const countWords = (text: string) => {
  const clean = stripHtml(text);
  return clean ? clean.split(/\s+/).length : 0;
};

const getHeadings = (html: string): string[] => {
  const matches = html.match(/<h[23][^>]*>(.*?)<\/h[23]>/gi) || [];
  return matches.map((m) => stripHtml(m).toLowerCase());
};

const getFirstParagraph = (html: string): string => {
  const match = html.match(/<p[^>]*>(.*?)<\/p>/i);
  return match ? stripHtml(match[1]).toLowerCase() : "";
};

export function runSEOAudit(data: SEOAuditData): { score: number; checks: SEOCheckResult[] } {
  const checks: SEOCheckResult[] = [];
  const kw = data.focusKeyword?.toLowerCase().trim();

  // 1. Focus Keyword in SEO Title
  if (!kw) {
    checks.push({ id: "kw-title", label: "Focus Keyword in SEO Title", status: "error", detail: "Set a focus keyword first." });
  } else {
    const title = (data.metaTitle || data.postTitle || "").toLowerCase();
    const atStart = title.startsWith(kw);
    const included = title.includes(kw);
    if (atStart) checks.push({ id: "kw-title", label: "Focus Keyword in SEO Title", status: "good", detail: "Keyword appears at the beginning of the title." });
    else if (included) checks.push({ id: "kw-title", label: "Focus Keyword in SEO Title", status: "warning", detail: "Keyword found but not at the start. Move it to the beginning." });
    else checks.push({ id: "kw-title", label: "Focus Keyword in SEO Title", status: "error", detail: "Keyword not found in the SEO title." });
  }

  // 2. Focus Keyword in Meta Description
  if (!kw) {
    checks.push({ id: "kw-meta", label: "Focus Keyword in Meta Description", status: "error", detail: "Set a focus keyword first." });
  } else {
    const desc = data.metaDescription.toLowerCase();
    if (desc.includes(kw)) checks.push({ id: "kw-meta", label: "Focus Keyword in Meta Description", status: "good", detail: "Keyword appears in the meta description." });
    else checks.push({ id: "kw-meta", label: "Focus Keyword in Meta Description", status: "error", detail: "Add the focus keyword to your meta description." });
  }

  // 3. Focus Keyword in URL
  if (!kw) {
    checks.push({ id: "kw-url", label: "Focus Keyword in URL", status: "error", detail: "Set a focus keyword first." });
  } else {
    const slugLower = data.slug.toLowerCase();
    const kwSlug = kw.replace(/\s+/g, "-");
    if (slugLower.includes(kwSlug) || slugLower.includes(kw.replace(/\s+/g, "")))
      checks.push({ id: "kw-url", label: "Focus Keyword in URL", status: "good", detail: "Keyword appears in the URL slug." });
    else checks.push({ id: "kw-url", label: "Focus Keyword in URL", status: "error", detail: "Include the focus keyword in the URL slug." });
  }

  // 4. Content Length
  const wordCount = countWords(data.content);
  if (wordCount > 600) checks.push({ id: "content-len", label: "Content is long enough", status: "good", detail: `${wordCount} words — great length for SEO.` });
  else if (wordCount >= 300) checks.push({ id: "content-len", label: "Content is long enough", status: "warning", detail: `${wordCount} words — aim for at least 600 words.` });
  else checks.push({ id: "content-len", label: "Content is long enough", status: "error", detail: `${wordCount} words — too short. Write at least 300 words.` });

  // 5. Keyword in first paragraph
  if (kw) {
    const firstP = getFirstParagraph(data.content);
    if (firstP.includes(kw)) checks.push({ id: "kw-intro", label: "Focus Keyword in introduction", status: "good", detail: "Keyword appears in the first paragraph." });
    else checks.push({ id: "kw-intro", label: "Focus Keyword in introduction", status: "warning", detail: "Add the keyword to the first paragraph for better SEO." });
  }

  // 6. Keyword in H2/H3 headings (at least 2)
  if (kw) {
    const headings = getHeadings(data.content);
    const kwHeadings = headings.filter((h) => h.includes(kw));
    if (kwHeadings.length >= 2) checks.push({ id: "kw-headings", label: "Focus Keyword in headings", status: "good", detail: `Found in ${kwHeadings.length} H2/H3 headings.` });
    else if (kwHeadings.length === 1) checks.push({ id: "kw-headings", label: "Focus Keyword in headings", status: "warning", detail: "Found in 1 heading. Aim for at least 2." });
    else checks.push({ id: "kw-headings", label: "Focus Keyword in headings", status: "error", detail: "Not found in any H2/H3 headings." });
  }

  // 7. Images have alt text with keyword
  const imgMatches = data.content.match(/<img[^>]*>/gi) || [];
  const hasImages = imgMatches.length > 0 || data.featuredImageAlt;
  if (!hasImages) {
    checks.push({ id: "img-alt", label: "Images have Alt attributes", status: "warning", detail: "No images found. Add at least one image with alt text." });
  } else if (kw) {
    const altTexts = imgMatches.map((m) => {
      const alt = m.match(/alt=["']([^"']*)["']/i);
      return alt ? alt[1].toLowerCase() : "";
    });
    if (data.featuredImageAlt) altTexts.push(data.featuredImageAlt.toLowerCase());
    const hasKwAlt = altTexts.some((a) => a.includes(kw));
    if (hasKwAlt) checks.push({ id: "img-alt", label: "Images have Alt attributes", status: "good", detail: "At least one image alt text contains the focus keyword." });
    else checks.push({ id: "img-alt", label: "Images have Alt attributes", status: "warning", detail: "Add the focus keyword to at least one image's alt text." });
  } else {
    checks.push({ id: "img-alt", label: "Images have Alt attributes", status: "warning", detail: "Set a focus keyword to check alt text optimization." });
  }

  // 8. Meta title length
  const titleLen = (data.metaTitle || data.postTitle || "").length;
  if (titleLen > 0 && titleLen <= 60) checks.push({ id: "title-len", label: "SEO Title length", status: "good", detail: `${titleLen}/60 characters — perfect.` });
  else if (titleLen > 60) checks.push({ id: "title-len", label: "SEO Title length", status: "warning", detail: `${titleLen}/60 characters — too long, may be truncated.` });
  else checks.push({ id: "title-len", label: "SEO Title length", status: "error", detail: "No title set." });

  // 9. Meta description length
  const descLen = data.metaDescription.length;
  if (descLen >= 120 && descLen <= 160) checks.push({ id: "meta-len", label: "Meta Description length", status: "good", detail: `${descLen}/160 characters — ideal length.` });
  else if (descLen > 0 && descLen < 120) checks.push({ id: "meta-len", label: "Meta Description length", status: "warning", detail: `${descLen}/160 characters — aim for 120-160.` });
  else if (descLen > 160) checks.push({ id: "meta-len", label: "Meta Description length", status: "warning", detail: `${descLen}/160 characters — too long.` });
  else checks.push({ id: "meta-len", label: "Meta Description length", status: "error", detail: "No meta description set." });

  // 10. Readability (sentence length)
  const plainText = stripHtml(data.content);
  const sentences = plainText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgSentenceLen = sentences.length > 0 ? Math.round(plainText.split(/\s+/).length / sentences.length) : 0;
  if (sentences.length === 0) {
    checks.push({ id: "readability", label: "Readability", status: "error", detail: "No content to analyze." });
  } else if (avgSentenceLen <= 20) {
    checks.push({ id: "readability", label: "Readability", status: "good", detail: `Average sentence length: ${avgSentenceLen} words — easy to read.` });
  } else if (avgSentenceLen <= 25) {
    checks.push({ id: "readability", label: "Readability", status: "warning", detail: `Average sentence length: ${avgSentenceLen} words — consider shorter sentences.` });
  } else {
    checks.push({ id: "readability", label: "Readability", status: "error", detail: `Average sentence length: ${avgSentenceLen} words — too long. Break up sentences.` });
  }

  // 11. Internal links
  const internalLinks = (data.content.match(/<a[^>]*href=["'][^"']*["'][^>]*>/gi) || [])
    .filter((a) => !a.match(/href=["']https?:\/\//i));
  const externalLinks = (data.content.match(/<a[^>]*href=["']https?:\/\/[^"']*["'][^>]*>/gi) || []);
  if (internalLinks.length >= 1) {
    checks.push({ id: "internal-links", label: "Internal links", status: "good", detail: `${internalLinks.length} internal link(s) found.` });
  } else {
    checks.push({ id: "internal-links", label: "Internal links", status: "warning", detail: "No internal links found. Add links to other pages on your site." });
  }
  if (externalLinks.length >= 1) {
    checks.push({ id: "external-links", label: "External links", status: "good", detail: `${externalLinks.length} external link(s) found.` });
  } else {
    checks.push({ id: "external-links", label: "External links", status: "warning", detail: "No external links. Adding credible outbound links can boost SEO." });
  }

  // 12. Keyword density
  if (kw && wordCount > 0) {
    const kwRegex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const kwCount = (plainText.match(kwRegex) || []).length;
    const density = (kwCount / wordCount) * 100;
    if (density >= 0.5 && density <= 2.5) {
      checks.push({ id: "kw-density", label: "Keyword density", status: "good", detail: `${density.toFixed(1)}% — optimal range (0.5-2.5%).` });
    } else if (density > 0 && density < 0.5) {
      checks.push({ id: "kw-density", label: "Keyword density", status: "warning", detail: `${density.toFixed(1)}% — too low. Use the keyword more naturally.` });
    } else if (density > 2.5) {
      checks.push({ id: "kw-density", label: "Keyword density", status: "warning", detail: `${density.toFixed(1)}% — too high. Reduce to avoid keyword stuffing.` });
    } else {
      checks.push({ id: "kw-density", label: "Keyword density", status: "error", detail: "Keyword not found in content." });
    }
  }

  // Calculate score
  const total = checks.length;
  const goodCount = checks.filter((c) => c.status === "good").length;
  const warnCount = checks.filter((c) => c.status === "warning").length;
  const score = Math.round(((goodCount * 1 + warnCount * 0.5) / total) * 100);

  return { score, checks };
}

// Score ring component
const ScoreRing = ({ score }: { score: number }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80 ? "hsl(142, 70%, 45%)" :
    score >= 50 ? "hsl(45, 93%, 47%)" :
    "hsl(0, 84%, 60%)";

  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
        <circle
          cx="40" cy="40" r={radius} fill="none"
          stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-500"
        />
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

interface SEOScoreWidgetProps {
  data: SEOAuditData;
}

const SEOScoreWidget = ({ data }: SEOScoreWidgetProps) => {
  const { score, checks } = useMemo(() => runSEOAudit(data), [data]);

  const errors = checks.filter((c) => c.status === "error");
  const warnings = checks.filter((c) => c.status === "warning");
  const goods = checks.filter((c) => c.status === "good");

  return (
    <div className="bg-background rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">SEO Score</h3>
      </div>

      <ScoreRing score={score} />

      <p className="text-center text-xs text-muted-foreground">
        {score >= 80 ? "Great! Your content is well optimized." :
         score >= 50 ? "Decent. Address the warnings to improve." :
         "Needs work. Fix the errors below."}
      </p>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-destructive uppercase tracking-wider">Errors ({errors.length})</p>
          {errors.map((c) => (
            <div key={c.id} className="flex items-start gap-2 p-2 rounded-lg bg-destructive/5">
              {statusIcon(c.status)}
              <div>
                <p className="text-xs font-medium text-foreground">{c.label}</p>
                <p className="text-[11px] text-muted-foreground">{c.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-[hsl(45,80%,35%)] uppercase tracking-wider">Warnings ({warnings.length})</p>
          {warnings.map((c) => (
            <div key={c.id} className="flex items-start gap-2 p-2 rounded-lg bg-[hsl(45,93%,47%)]/5">
              {statusIcon(c.status)}
              <div>
                <p className="text-xs font-medium text-foreground">{c.label}</p>
                <p className="text-[11px] text-muted-foreground">{c.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Good */}
      {goods.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-[hsl(142,60%,35%)] uppercase tracking-wider">Passed ({goods.length})</p>
          {goods.map((c) => (
            <div key={c.id} className="flex items-start gap-2 p-2 rounded-lg bg-[hsl(142,70%,45%)]/5">
              {statusIcon(c.status)}
              <div>
                <p className="text-xs font-medium text-foreground">{c.label}</p>
                <p className="text-[11px] text-muted-foreground">{c.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SEOScoreWidget;
