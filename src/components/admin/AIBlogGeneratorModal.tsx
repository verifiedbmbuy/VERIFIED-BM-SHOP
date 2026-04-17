import { useState } from "react";
import { Sparkles, Loader2, Wand2, FileText, Target, Tag, MessageSquare, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CATEGORIES = [
  "Verified BM",
  "WhatsApp API",
  "Tips & Guides",
  "Guides",
  "Facebook Accounts",
  "TikTok Ads",
];

const TONES = [
  "Professional and conversational",
  "Beginner-friendly and educational",
  "Expert-level and technical",
  "Sales-focused and persuasive",
];

export interface GeneratedBlogData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  readTime: string;
  focusKeyword: string;
  featuredImageSlug?: string;
  featuredImageUrl?: string;
  bodyImageUrl?: string;
  faqs?: { question: string; answer: string }[];
}

interface AIBlogGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: (data: GeneratedBlogData) => void;
}

const AIBlogGeneratorModal = ({ open, onOpenChange, onGenerated }: AIBlogGeneratorModalProps) => {
  const [topic, setTopic] = useState("");
  const [focusKeyword, setFocusKeyword] = useState("");
  const [category, setCategory] = useState("Verified BM");
  const [tone, setTone] = useState(TONES[0]);
  const [generateImages, setGenerateImages] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState("");

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Enter a topic for your blog post.");
      return;
    }
    if (!focusKeyword.trim()) {
      toast.error("Enter a focus keyword for SEO.");
      return;
    }

    setGenerating(true);
    setProgress("Analyzing topic and keyword strategy...");

    try {
      setTimeout(() => setProgress("Generating SEO-optimized content..."), 3000);
      setTimeout(() => setProgress("Building FAQ section and structure..."), 8000);
      if (generateImages) {
        setTimeout(() => setProgress("🎨 Generating AI thumbnail image..."), 13000);
        setTimeout(() => setProgress("🎨 Generating AI body image..."), 18000);
        setTimeout(() => setProgress("Uploading images and finalizing..."), 23000);
      } else {
        setTimeout(() => setProgress("Adding related products and final touches..."), 13000);
      }

      const { data, error } = await supabase.functions.invoke("generate-blog-post", {
        body: { topic, focusKeyword, category, tone, generateImages },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const result: GeneratedBlogData = {
        title: data.title || topic,
        slug: data.slug || focusKeyword.toLowerCase().replace(/\s+/g, "-"),
        content: data.content || "",
        excerpt: data.excerpt || "",
        metaTitle: data.metaTitle || data.title || "",
        metaDescription: data.metaDescription || "",
        readTime: data.readTime || "5 min read",
        focusKeyword,
        featuredImageSlug: data.featuredImageSlug,
        featuredImageUrl: data.featuredImageUrl,
        bodyImageUrl: data.bodyImageUrl,
        faqs: data.faqs || [],
      };

      onGenerated(result);

      const imgMsg = generateImages
        ? (result.featuredImageUrl ? " with AI-generated images!" : " (images could not be generated)")
        : "!";
      toast.success(`Blog post generated${imgMsg} Review and edit before publishing.`);
      onOpenChange(false);

      setTopic("");
      setFocusKeyword("");
    } catch (err: any) {
      console.error("Blog generation error:", err);
      toast.error(err.message || "Failed to generate blog post. Try again.");
    } finally {
      setGenerating(false);
      setProgress("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Blog Generator
          </DialogTitle>
          <DialogDescription>
            Generate a professional, SEO-optimized blog post with AI-generated images.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Topic */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              Blog Topic *
            </label>
            <Textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., How to buy a verified Facebook Business Manager safely in 2026"
              rows={2}
              className="text-sm"
              disabled={generating}
            />
          </div>

          {/* Focus Keyword */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-muted-foreground" />
              Focus Keyword *
            </label>
            <Input
              value={focusKeyword}
              onChange={(e) => setFocusKeyword(e.target.value)}
              placeholder="e.g., verified business manager"
              className="text-sm"
              disabled={generating}
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              This keyword will appear in the title, H2s, first paragraph, URL, and meta tags.
            </p>
          </div>

          {/* Category & Tone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                Category
              </label>
              <Select value={category} onValueChange={setCategory} disabled={generating}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                Tone
              </label>
              <Select value={tone} onValueChange={setTone} disabled={generating}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Generate Images Toggle */}
          <div className="bg-secondary/40 rounded-lg p-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={generateImages}
                onCheckedChange={(v) => setGenerateImages(!!v)}
                disabled={generating}
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <ImageIcon className="w-3.5 h-3.5 text-primary" />
                  Generate AI Images
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Creates a featured thumbnail + a body illustration, uploaded to Media Library automatically.
                </p>
              </div>
            </label>
          </div>

          {/* What AI will generate */}
          <div className="bg-secondary/40 rounded-lg p-3 space-y-1.5">
            <p className="text-xs font-semibold text-foreground">✨ AI will generate:</p>
            <ul className="text-[11px] text-muted-foreground space-y-1">
              <li>• SEO title with power word + number for high CTR</li>
              <li>• Key Takeaway box + Table of Contents</li>
              <li>• 800-1200 word post with natural, human-like writing</li>
              <li>• FAQ section targeting "People Also Ask" snippets</li>
              <li>• Related Products widget with internal links</li>
              <li>• Meta description under 155 chars with CTA</li>
              {generateImages && (
                <>
                  <li>• 🎨 Featured thumbnail image (16:9, social-ready)</li>
                  <li>• 🎨 In-body illustration inserted after first section</li>
                </>
              )}
            </ul>
          </div>

          {/* Progress */}
          {generating && (
            <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Generating blog post…</p>
                <p className="text-xs text-muted-foreground">{progress}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={generating}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generating || !topic.trim() || !focusKeyword.trim()}
              className="flex-1 gap-2 bg-gradient-to-r from-primary to-[hsl(280,80%,55%)] hover:opacity-90 text-white"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              {generating ? "Generating…" : "Generate Post"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIBlogGeneratorModal;
