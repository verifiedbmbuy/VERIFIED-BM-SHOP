/**
 * Lightweight SEO scoring utility.
 * Reuses the same logic as AdvancedSEOSidebar's `runAdvancedSEOAudit`
 * but works on raw row data from the list views.
 */

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const countWords = (text: string) => { const c = stripHtml(text); return c ? c.split(/\s+/).length : 0; };

const POWER_WORDS = [
  "best", "top", "proven", "ultimate", "exclusive", "premium", "instant",
  "guaranteed", "secure", "trusted", "verified", "powerful", "essential",
  "secret", "free", "limited", "official", "professional", "expert",
  "fastest", "cheapest", "reliable", "safe", "legit", "authentic",
];

export interface SEOScoreResult {
  score: number;
  issues: string[];
  focusKeyword: string;
  urlLength: number;
  urlExceeds75: boolean;
}

interface ScoringInput {
  title: string;
  slug: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  focusKeyword?: string | null;
  content?: string | null;
  urlPrefix?: string;
  fullUrl?: string;
}

export function computeSEOScore(input: ScoringInput): SEOScoreResult {
  const checks: { pass: boolean; half?: boolean; issue?: string }[] = [];
  const kw = (input.focusKeyword || "").toLowerCase().trim();
  const title = (input.metaTitle || input.title || "").toLowerCase();
  const fullTitle = input.metaTitle || input.title || "";
  const desc = input.metaDescription || "";
  const prefix = input.urlPrefix || "/";
  const fullUrl = input.fullUrl || `https://verifiedbm.shop${prefix}${input.slug}`;
  const plainText = stripHtml(input.content || "");
  const wordCount = countWords(input.content || "");

  // 1. Focus keyword set
  if (!kw) {
    checks.push({ pass: false, issue: "No focus keyword" });
  } else {
    checks.push({ pass: true });
  }

  // 2. Keyword in title
  if (kw && title.includes(kw)) checks.push({ pass: true });
  else if (kw) checks.push({ pass: false, issue: "Keyword missing from title" });
  else checks.push({ pass: false });

  // 3. Keyword in meta description
  if (kw && desc.toLowerCase().includes(kw)) checks.push({ pass: true });
  else if (desc.length > 0) checks.push({ pass: false, half: true, issue: "Keyword not in description" });
  else checks.push({ pass: false, issue: "No meta description" });

  // 4. Meta description length
  if (desc.length >= 120 && desc.length <= 160) checks.push({ pass: true });
  else if (desc.length > 0) checks.push({ pass: false, half: true, issue: `Description ${desc.length}/160 chars` });
  else checks.push({ pass: false, issue: "No meta description" });

  // 5. Title length
  if (fullTitle.length > 0 && fullTitle.length <= 60) checks.push({ pass: true });
  else if (fullTitle.length > 60) checks.push({ pass: false, half: true, issue: "Title too long" });
  else checks.push({ pass: false, issue: "No SEO title" });

  // 6. Power word
  const titleWords = fullTitle.toLowerCase().split(/\s+/);
  if (titleWords.some((w) => POWER_WORDS.includes(w))) checks.push({ pass: true });
  else checks.push({ pass: false, half: true, issue: "No power word in title" });

  // 7. Number in title
  if (/\d/.test(fullTitle)) checks.push({ pass: true });
  else checks.push({ pass: false, half: true, issue: "No number in title" });

  // 8. Slug contains keyword
  if (kw) {
    const kwSlug = kw.replace(/\s+/g, "-");
    if (input.slug.toLowerCase().includes(kwSlug)) checks.push({ pass: true });
    else checks.push({ pass: false, half: true, issue: "Keyword not in URL" });
  } else {
    checks.push({ pass: false });
  }

  // 9. URL length
  if (fullUrl.length <= 75) checks.push({ pass: true });
  else checks.push({ pass: false, half: true, issue: `URL ${fullUrl.length} chars (>75)` });

  // 10. Content length
  if (wordCount >= 300) checks.push({ pass: true });
  else if (wordCount > 0) checks.push({ pass: false, half: true, issue: `Only ${wordCount} words` });
  else checks.push({ pass: false, half: true, issue: "No content" });

  const total = checks.length;
  const score = Math.round(
    checks.reduce((acc, c) => acc + (c.pass ? 1 : c.half ? 0.5 : 0), 0) / total * 100
  );

  const issues = checks.filter((c) => !c.pass && c.issue).map((c) => c.issue!);

  return {
    score,
    issues,
    focusKeyword: input.focusKeyword || "",
    urlLength: fullUrl.length,
    urlExceeds75: fullUrl.length > 75,
  };
}

export function getScoreColor(score: number): "green" | "orange" | "red" {
  if (score >= 80) return "green";
  if (score >= 50) return "orange";
  return "red";
}

export function getScoreBadgeClasses(score: number): string {
  const color = getScoreColor(score);
  if (color === "green") return "bg-[hsl(142,70%,45%)]/15 text-[hsl(142,70%,45%)] border-[hsl(142,70%,45%)]/30";
  if (color === "orange") return "bg-[hsl(45,93%,47%)]/15 text-[hsl(45,93%,47%)] border-[hsl(45,93%,47%)]/30";
  return "bg-destructive/15 text-destructive border-destructive/30";
}
