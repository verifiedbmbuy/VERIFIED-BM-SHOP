import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  ArrowLeft,
  Save,
  Send,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Undo,
  Redo,
  Upload,
  ImageIcon,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import MediaLibraryModal from "@/components/admin/MediaLibraryModal";
import AIBlogGeneratorModal, { type GeneratedBlogData } from "@/components/admin/AIBlogGeneratorModal";
import SEOSettingsPanel from "@/components/admin/SEOSettingsPanel";
import AdvancedSEOSidebar from "@/components/admin/AdvancedSEOSidebar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CATEGORIES = [
  "Verified BM",
  "WhatsApp API",
  "Tips & Guides",
  "Guides",
  "Facebook Accounts",
  "TikTok Ads",
];

const generateSlug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const AdminPostEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [status, setStatus] = useState<string>("draft");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["Verified BM"]);
  const [author, setAuthor] = useState("Admin");
  const [readTime, setReadTime] = useState("5 min read");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [focusKeyword, setFocusKeyword] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [noIndex, setNoIndex] = useState(false);
  const [titleError, setTitleError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "saving">("saved");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const [aiGeneratorOpen, setAiGeneratorOpen] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const autosaveTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasChanges = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start writing your post content here… Use the toolbar above for formatting.",
      }),
    ],
    content: "",
    onUpdate: () => {
      markUnsaved();
    },
    editorProps: {
      attributes: {
        class: "tiptap prose prose-sm sm:prose max-w-none min-h-[400px] focus:outline-none p-4",
      },
    },
  });

  const markUnsaved = useCallback(() => {
    hasChanges.current = true;
    setSaveStatus("unsaved");
  }, []);

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugManual && title) {
      setSlug(generateSlug(title));
    }
  }, [title, slugManual]);

  // Load existing post
  useEffect(() => {
    if (!isNew && id) {
      const loadPost = async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("id", id)
          .single();
        if (!error && data) {
          setTitle(data.title);
          setSlug(data.slug);
          setSlugManual(true);
          setExcerpt(data.excerpt || "");
          setFeaturedImage(data.featured_image || "");
          setStatus((data as any).status || "draft");
          setAuthor((data as any).author || "Admin");
          setReadTime(data.read_time || "5 min read");
          setMetaTitle((data as any).meta_title || "");
          setMetaDescription((data as any).meta_description || "");
          setFocusKeyword((data as any).focus_keyword || "");
          setSelectedCategories([data.category]);
          if (editor && data.content) {
            editor.commands.setContent(data.content);
          }
        }
        setLoading(false);
      };
      loadPost();
    }
  }, [id, isNew, editor]);

  // Autosave every 30s
  useEffect(() => {
    autosaveTimer.current = setInterval(() => {
      if (hasChanges.current && title.trim()) {
        setSaveStatus("saving");
        // Mock autosave
        setTimeout(() => {
          hasChanges.current = false;
          setSaveStatus("saved");
        }, 500);
      }
    }, 30000);
    return () => {
      if (autosaveTimer.current) clearInterval(autosaveTimer.current);
    };
  }, [title]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setTitleError(false);
    markUnsaved();
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
    markUnsaved();
  };

  const getPayload = (overrideStatus?: string) => ({
    title,
    slug,
    content: editor?.getHTML() || null,
    excerpt: excerpt || null,
    featured_image: featuredImage || null,
    category: selectedCategories[0] || "Verified BM",
    read_time: readTime || "5 min read",
    author: author || "Admin",
    meta_title: metaTitle || null,
    meta_description: metaDescription || null,
    focus_keyword: focusKeyword || null,
    status: overrideStatus || status,
    published_at: (overrideStatus || status) === "published" ? new Date().toISOString() : null,
  });

  const handleSave = async (asPublish = false) => {
    if (!title.trim()) {
      setTitleError(true);
      toast.error("Title is required.");
      return;
    }
    if (!slug.trim()) {
      toast.error("Slug is required.");
      return;
    }

    setSaving(true);
    setSaveStatus("saving");
    const payload = getPayload(asPublish ? "published" : undefined);

    if (!isNew && id) {
      const { error } = await supabase.from("blog_posts").update(payload).eq("id", id);
      if (error) { toast.error("Failed to save."); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("blog_posts").insert(payload);
      if (error) { toast.error("Failed to create post."); setSaving(false); return; }
    }

    setSaving(false);
    hasChanges.current = false;
    setSaveStatus("saved");
    if (asPublish) setStatus("published");
    toast.success(asPublish ? "Post published!" : "Draft saved.");
    if (isNew) navigate("/admin/posts");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading post…
      </div>
    );
  }

  return (
    <div className="space-y-0 -m-4 sm:-m-6 lg:-m-8">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-background border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate("/admin/posts")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Posts</span>
          </button>

          {/* Status indicator */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {saveStatus === "saved" && (
              <>
                <Check className="w-3.5 h-3.5 text-green-500" />
                <span className="hidden sm:inline">Saved</span>
              </>
            )}
            {saveStatus === "unsaved" && (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Unsaved changes</span>
              </>
            )}
            {saveStatus === "saving" && (
              <>
                <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="hidden sm:inline">Saving…</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isNew && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAiGeneratorOpen(true)}
              className="gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Generate with AI</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="gap-1.5"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Save Draft</span>
          </Button>
          <Button
            size="sm"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="gap-1.5"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Publish
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-4">
            {/* Title */}
            <div>
              <input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Enter title here…"
                className={cn(
                  "w-full text-2xl sm:text-3xl font-bold bg-transparent border-0 border-b-2 pb-3 focus:outline-none transition-colors placeholder:text-muted-foreground/40",
                  titleError
                    ? "border-destructive text-destructive"
                    : "border-transparent focus:border-primary"
                )}
              />
              {titleError && (
                <p className="text-xs text-destructive mt-1.5">Title is required to publish.</p>
              )}
            </div>

            {/* Slug */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground shrink-0">URL:</span>
              <Input
                value={slug}
                onChange={(e) => {
                  setSlugManual(true);
                  setSlug(e.target.value);
                  markUnsaved();
                }}
                placeholder="post-slug"
                className="h-8 text-sm font-mono"
              />
            </div>

            {/* Toolbar */}
            <div className="bg-background rounded-xl border border-border overflow-hidden">
              <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border bg-secondary/30">
                <ToolbarBtn
                  icon={Bold}
                  active={editor?.isActive("bold")}
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  label="Bold"
                />
                <ToolbarBtn
                  icon={Italic}
                  active={editor?.isActive("italic")}
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  label="Italic"
                />
                <div className="w-px h-5 bg-border mx-1" />
                <ToolbarBtn
                  icon={Heading1}
                  active={editor?.isActive("heading", { level: 1 })}
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                  label="Heading 1"
                />
                <ToolbarBtn
                  icon={Heading2}
                  active={editor?.isActive("heading", { level: 2 })}
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                  label="Heading 2"
                />
                <ToolbarBtn
                  icon={Heading3}
                  active={editor?.isActive("heading", { level: 3 })}
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                  label="Heading 3"
                />
                <div className="w-px h-5 bg-border mx-1" />
                <ToolbarBtn
                  icon={List}
                  active={editor?.isActive("bulletList")}
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  label="Bullet List"
                />
                <ToolbarBtn
                  icon={ListOrdered}
                  active={editor?.isActive("orderedList")}
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  label="Ordered List"
                />
                <ToolbarBtn
                  icon={Quote}
                  active={editor?.isActive("blockquote")}
                  onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                  label="Quote"
                />
                <div className="w-px h-5 bg-border mx-1" />
                <ToolbarBtn
                  icon={Undo}
                  onClick={() => editor?.chain().focus().undo().run()}
                  label="Undo"
                />
                <ToolbarBtn
                  icon={Redo}
                  onClick={() => editor?.chain().focus().redo().run()}
                  label="Redo"
                />
              </div>

              <EditorContent editor={editor} />
            </div>
          </div>

          {/* Sidebar Settings */}
          <div className="space-y-4 order-last">
            {/* Collapsible Toggle (mobile) */}
            <button
              onClick={() => setSidebarOpen((s) => !s)}
              className="lg:hidden w-full flex items-center justify-between bg-background rounded-xl border border-border px-4 py-3 text-sm font-medium text-foreground"
            >
              Post Settings
              {sidebarOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <div className={cn("space-y-4", !sidebarOpen && "hidden lg:block")}>
              {/* Status */}
              <div className="bg-background rounded-xl border border-border p-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Status</h3>
                <Select value={status} onValueChange={(v) => { setStatus(v); markUnsaved(); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
                <Badge variant={status === "published" ? "default" : "secondary"} className="text-xs">
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
              </div>

              {/* Categories */}
              <div className="bg-background rounded-xl border border-border p-5 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Categories</h3>
                <div className="space-y-2">
                  {CATEGORIES.map((cat) => (
                    <label key={cat} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={selectedCategories.includes(cat)}
                        onCheckedChange={() => toggleCategory(cat)}
                      />
                      <span className="text-foreground">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Featured Image */}
              <div className="bg-background rounded-xl border border-border p-5 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Featured Image</h3>
                {featuredImage ? (
                  <div className="space-y-2">
                    <img
                      src={featuredImage}
                      alt="Featured"
                      className="w-full h-32 object-cover rounded-lg border border-border"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => { setFeaturedImage(""); markUnsaved(); }}
                    >
                      Remove Image
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div
                      className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => setMediaLibraryOpen(true)}
                    >
                      <ImageIcon className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">
                        Click to browse Media Library
                      </p>
                    </div>
                    <Input
                      placeholder="Or paste image URL…"
                      value={featuredImage}
                      onChange={(e) => { setFeaturedImage(e.target.value); markUnsaved(); }}
                      className="text-xs h-8"
                    />
                  </div>
                )}
              </div>

              {/* Excerpt */}
              <div className="bg-background rounded-xl border border-border p-5 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Excerpt</h3>
                <Textarea
                  value={excerpt}
                  onChange={(e) => { setExcerpt(e.target.value); markUnsaved(); }}
                  placeholder="Write a short summary…"
                  rows={3}
                  className="text-sm"
                />
              </div>

              {/* Author & Read Time */}
              <div className="bg-background rounded-xl border border-border p-5 space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Author</label>
                  <Input
                    value={author}
                    onChange={(e) => { setAuthor(e.target.value); markUnsaved(); }}
                    placeholder="Author name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Read Time</label>
                  <Input
                    value={readTime}
                    onChange={(e) => { setReadTime(e.target.value); markUnsaved(); }}
                    placeholder="5 min read"
                  />
                </div>
              </div>

              {/* Advanced SEO Sidebar */}
              <AdvancedSEOSidebar
                data={{
                  focusKeyword,
                  metaTitle,
                  metaDescription,
                  slug,
                  content: editor?.getHTML() || "",
                  postTitle: title,
                  urlPrefix: "/blog/",
                }}
                focusKeyword={focusKeyword}
                metaTitle={metaTitle}
                metaDescription={metaDescription}
                onFocusKeywordChange={(v) => { setFocusKeyword(v); markUnsaved(); }}
                onMetaTitleChange={(v) => { setMetaTitle(v); markUnsaved(); }}
                onMetaDescriptionChange={(v) => { setMetaDescription(v); markUnsaved(); }}
                onSlugChange={(v) => { setSlug(v); setSlugManual(true); markUnsaved(); }}
              />

              {/* SEO Settings (Advanced) */}
              <SEOSettingsPanel
                metaTitle={metaTitle}
                metaDescription={metaDescription}
                focusKeyword={focusKeyword}
                postTitle={title}
                slug={slug}
                featuredImage={featuredImage}
                canonicalUrl={canonicalUrl}
                noIndex={noIndex}
                onMetaTitleChange={(v) => { setMetaTitle(v); markUnsaved(); }}
                onMetaDescriptionChange={(v) => { setMetaDescription(v); markUnsaved(); }}
                onFocusKeywordChange={(v) => { setFocusKeyword(v); markUnsaved(); }}
                onCanonicalUrlChange={(v) => { setCanonicalUrl(v); markUnsaved(); }}
                onNoIndexChange={(v) => { setNoIndex(v); markUnsaved(); }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Media Library Modal */}
      <MediaLibraryModal
        open={mediaLibraryOpen}
        onOpenChange={setMediaLibraryOpen}
        uploadPathPrefix="blog-posts"
        onSelect={(file) => {
          setFeaturedImage(file.url);
          markUnsaved();
        }}
      />

      {/* AI Blog Generator Modal */}
      <AIBlogGeneratorModal
        open={aiGeneratorOpen}
        onOpenChange={setAiGeneratorOpen}
        onGenerated={(data: GeneratedBlogData) => {
          setTitle(data.title);
          setSlug(data.slug);
          setSlugManual(true);
          setExcerpt(data.excerpt);
          setMetaTitle(data.metaTitle);
          setMetaDescription(data.metaDescription);
          setFocusKeyword(data.focusKeyword);
          setReadTime(data.readTime);
          if (editor && data.content) {
            editor.commands.setContent(data.content);
          }
          if (data.featuredImageUrl) {
            setFeaturedImage(data.featuredImageUrl);
          } else if (data.featuredImageSlug) {
            setFeaturedImage(`https://verifiedbm.shop/media/${data.featuredImageSlug}`);
          }
          markUnsaved();
        }}
      />
    </div>
  );
};

// Toolbar button helper
const ToolbarBtn = ({
  icon: Icon,
  active,
  onClick,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  onClick?: () => void;
  label: string;
}) => (
  <button
    onClick={onClick}
    title={label}
    className={cn(
      "p-1.5 rounded transition-colors",
      active
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-accent hover:text-foreground"
    )}
  >
    <Icon className="w-4 h-4" />
  </button>
);

export default AdminPostEditor;
