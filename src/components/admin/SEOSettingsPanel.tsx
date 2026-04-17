import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Globe, Eye, Facebook, Twitter, Link2, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface SEOSettingsPanelProps {
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  postTitle: string;
  slug: string;
  featuredImage?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  onMetaTitleChange: (v: string) => void;
  onMetaDescriptionChange: (v: string) => void;
  onFocusKeywordChange: (v: string) => void;
  onCanonicalUrlChange?: (v: string) => void;
  onNoIndexChange?: (v: boolean) => void;
}

const SEOSettingsPanel = ({
  metaTitle,
  metaDescription,
  focusKeyword,
  postTitle,
  slug,
  featuredImage,
  canonicalUrl = "",
  noIndex = false,
  onMetaTitleChange,
  onMetaDescriptionChange,
  onFocusKeywordChange,
  onCanonicalUrlChange,
  onNoIndexChange,
}: SEOSettingsPanelProps) => {
  const [previewMode, setPreviewMode] = useState<"google" | "facebook" | "twitter">("google");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const displayTitle = (metaTitle || postTitle || "Untitled Post") + " | Verified BM Shop";
  const displayDesc = metaDescription || "No description provided. Add a meta description to improve search visibility.";
  const displayUrl = `verifiedbm.shop/blog/${slug || "post-slug"}`;
  const displayImage = featuredImage || "/og-default.png";

  return (
    <div className="bg-background rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">SEO Settings</h3>
      </div>

      {/* Preview Tabs */}
      <div className="flex gap-1 bg-secondary/40 rounded-lg p-0.5">
        <button
          onClick={() => setPreviewMode("google")}
          className={cn("flex-1 text-xs py-1.5 px-2 rounded-md font-medium transition-colors", previewMode === "google" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
        >
          Google
        </button>
        <button
          onClick={() => setPreviewMode("facebook")}
          className={cn("flex-1 text-xs py-1.5 px-2 rounded-md font-medium transition-colors flex items-center justify-center gap-1", previewMode === "facebook" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
        >
          <Facebook className="w-3 h-3" /> Facebook
        </button>
        <button
          onClick={() => setPreviewMode("twitter")}
          className={cn("flex-1 text-xs py-1.5 px-2 rounded-md font-medium transition-colors flex items-center justify-center gap-1", previewMode === "twitter" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
        >
          <Twitter className="w-3 h-3" /> X
        </button>
      </div>

      {/* Google Preview */}
      {previewMode === "google" && (
        <div className="bg-secondary/40 rounded-lg p-4 space-y-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Google Preview</p>
          <p className="text-[hsl(217,89%,61%)] text-sm font-medium leading-tight truncate">
            {displayTitle.slice(0, 60)}
          </p>
          <p className="text-[hsl(142,70%,45%)] text-xs truncate">{displayUrl}</p>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {displayDesc.slice(0, 160)}
          </p>
        </div>
      )}

      {/* Facebook OG Preview */}
      {previewMode === "facebook" && (
        <div className="bg-secondary/40 rounded-lg overflow-hidden">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-4 pt-3 mb-2">Facebook Preview</p>
          {displayImage && (
            <div className="aspect-[1.91/1] bg-muted mx-3 rounded overflow-hidden">
              <img src={displayImage} alt="OG preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          )}
          <div className="p-3 space-y-0.5">
            <p className="text-[10px] text-muted-foreground uppercase">verifiedbm.shop</p>
            <p className="text-sm font-semibold text-foreground leading-tight truncate">{displayTitle.slice(0, 60)}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">{displayDesc.slice(0, 160)}</p>
          </div>
        </div>
      )}

      {/* X/Twitter Preview */}
      {previewMode === "twitter" && (
        <div className="bg-secondary/40 rounded-xl overflow-hidden border border-border">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-4 pt-3 mb-2">X (Twitter) Preview</p>
          {displayImage && (
            <div className="aspect-[2/1] bg-muted mx-3 rounded-lg overflow-hidden">
              <img src={displayImage} alt="Twitter card" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          )}
          <div className="p-3 space-y-0.5">
            <p className="text-sm font-semibold text-foreground leading-tight truncate">{displayTitle.slice(0, 60)}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">{displayDesc.slice(0, 160)}</p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Link2 className="w-3 h-3" /> verifiedbm.shop</p>
          </div>
        </div>
      )}

      {/* Meta Title */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Meta Title</label>
        <Input
          value={metaTitle}
          onChange={(e) => onMetaTitleChange(e.target.value)}
          placeholder={postTitle || "Defaults to post title"}
          maxLength={60}
          className="text-sm"
        />
        <p className="text-xs text-muted-foreground mt-1">
          {(metaTitle || postTitle || "").length}/60 characters
        </p>
      </div>

      {/* Meta Description */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Meta Description</label>
        <Textarea
          value={metaDescription}
          onChange={(e) => onMetaDescriptionChange(e.target.value)}
          placeholder="Write a concise summary for search engines…"
          rows={3}
          className="text-sm"
        />
        <p className={`text-xs mt-1 ${metaDescription.length > 150 ? "text-destructive" : "text-muted-foreground"}`}>
          {metaDescription.length}/160 characters
        </p>
      </div>

      {/* Focus Keyword */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Focus Keyword</label>
        <Input
          value={focusKeyword}
          onChange={(e) => onFocusKeywordChange(e.target.value)}
          placeholder="e.g. verified business manager"
          className="text-sm"
        />
      </div>

      {/* Advanced SEO */}
      <button
        onClick={() => setAdvancedOpen(!advancedOpen)}
        className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors pt-2"
      >
        <span>Advanced SEO</span>
        {advancedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {advancedOpen && (
        <div className="space-y-4 pt-1">
          {/* Canonical URL */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5" /> Canonical URL
            </label>
            <Input
              value={canonicalUrl}
              onChange={(e) => onCanonicalUrlChange?.(e.target.value)}
              placeholder={`${window.location.origin}/blog/original-post`}
              className="text-sm font-mono"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Leave empty to use the default URL. Set this if this page is a duplicate of another.</p>
          </div>

          {/* No-Index Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
            <div className="flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">No-Index</p>
                <p className="text-[11px] text-muted-foreground">Hide this page from search engines.</p>
              </div>
            </div>
            <Switch
              checked={noIndex}
              onCheckedChange={(v) => onNoIndexChange?.(v)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SEOSettingsPanel;
