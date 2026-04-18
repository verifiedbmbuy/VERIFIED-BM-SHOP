import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toBrandedUrl } from "@/lib/imageUtils";
import { uploadLocalMedia } from "@/lib/localMedia";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2, Eye, EyeOff, Plus, Trash2, Upload, X, Image as ImageIcon } from "lucide-react";
import AdvancedSEOSidebar from "@/components/admin/AdvancedSEOSidebar";
import { Slider } from "@/components/ui/slider";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

interface ContentField {
  key: string;
  label: string;
  type: "text" | "textarea" | "richtext";
  value: string;
}

interface PageData {
  id?: string;
  title: string;
  slug: string;
  content: string | null;
  status: string;
  meta_title: string | null;
  meta_description: string | null;
  components: Record<string, boolean>;
  hero_image: string | null;
  hero_overlay: number;
}

// Default content schema templates per page type
const PAGE_SCHEMAS: Record<string, ContentField[]> = {
  home: [
    { key: "hero_title", label: "Hero Title", type: "text", value: "" },
    { key: "hero_subtitle", label: "Hero Subtitle", type: "text", value: "" },
    { key: "hero_description", label: "Hero Description", type: "textarea", value: "" },
    { key: "hero_cta_text", label: "Hero CTA Text", type: "text", value: "" },
    { key: "hero_badge", label: "Hero Badge Text", type: "text", value: "" },
    { key: "stats_section", label: "Stats Section (hidden if empty)", type: "text", value: "" },
    { key: "about_title", label: "About Section Title", type: "text", value: "" },
    { key: "about_text", label: "About Section Text", type: "richtext", value: "" },
  ],
  about: [
    { key: "page_subtitle", label: "Page Subtitle", type: "text", value: "" },
    { key: "page_description", label: "Header Description", type: "textarea", value: "" },
    { key: "about_heading", label: "About Heading", type: "text", value: "" },
    { key: "about_text", label: "About Text", type: "richtext", value: "" },
    { key: "mission_title", label: "Mission Title", type: "text", value: "" },
    { key: "mission_text", label: "Mission Text", type: "richtext", value: "" },
    { key: "vision_title", label: "Vision Title", type: "text", value: "" },
    { key: "vision_text", label: "Vision Text", type: "richtext", value: "" },
    { key: "story_title", label: "Story Title", type: "text", value: "" },
    { key: "story_text", label: "Story Text", type: "richtext", value: "" },
    { key: "cta_title", label: "CTA Title", type: "text", value: "" },
    { key: "cta_text", label: "CTA Text", type: "textarea", value: "" },
  ],
  contact: [
    { key: "page_description", label: "Header Description", type: "textarea", value: "" },
    { key: "form_title", label: "Contact Form Title", type: "text", value: "" },
    { key: "address", label: "Address", type: "textarea", value: "" },
    { key: "email", label: "Email", type: "text", value: "" },
    { key: "phone", label: "Phone", type: "text", value: "" },
  ],
  default: [
    { key: "page_description", label: "Page Description", type: "textarea", value: "" },
    { key: "body_content", label: "Body Content", type: "richtext", value: "" },
  ],
};

const getSchemaForSlug = (slug: string): ContentField[] => {
  return PAGE_SCHEMAS[slug] || PAGE_SCHEMAS.default;
};

// Tiptap Rich Text Editor component
const RichTextField = ({ value, onChange, placeholder }: { value: string; onChange: (val: string) => void; placeholder?: string }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder || "Write content…" }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!editor) return null;

  return (
    <div className="border border-border rounded-lg overflow-hidden mt-1.5">
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border bg-muted/50">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1.5 rounded text-xs font-bold ${editor.isActive("bold") ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}>B</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1.5 rounded text-xs italic ${editor.isActive("italic") ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}>I</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-1.5 rounded text-xs ${editor.isActive("bulletList") ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}>• List</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-1.5 rounded text-xs ${editor.isActive("orderedList") ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}>1. List</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-1.5 rounded text-xs ${editor.isActive("heading", { level: 2 }) ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}>H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`p-1.5 rounded text-xs ${editor.isActive("heading", { level: 3 }) ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}>H3</button>
      </div>
      <EditorContent editor={editor} className="prose prose-sm max-w-none p-3 min-h-[120px] focus-within:outline-none [&_.tiptap]:outline-none [&_.tiptap]:min-h-[100px]" />
    </div>
  );
};

// Live Preview component
const LivePreview = ({ fields, title, heroImage, heroOverlay }: { fields: ContentField[]; title: string; heroImage?: string | null; heroOverlay?: number }) => {
  const hasContent = fields.some((f) => f.value?.trim());

  return (
    <div className="bg-background border border-border rounded-xl overflow-hidden">
      <div className="bg-muted/50 px-4 py-2 border-b border-border flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-destructive/50" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
          <div className="w-3 h-3 rounded-full bg-green-500/50" />
        </div>
        <span className="text-xs text-muted-foreground ml-2">Preview — {title || "Untitled"}</span>
      </div>

      {/* Hero Section */}
      {heroImage && (
        <div className="relative h-32 overflow-hidden">
          <img src={toBrandedUrl(heroImage)} alt="Hero" className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: `rgba(0,0,0,${(heroOverlay ?? 50) / 100})` }}>
            <h1 className="text-white text-xl font-bold">{title}</h1>
          </div>
        </div>
      )}

      <div className="p-6 max-h-[500px] overflow-y-auto space-y-4">
        {!hasContent && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Eye className="w-8 h-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Start adding content in the fields to see a live preview here.</p>
          </div>
        )}
        {fields.map((field) => {
          if (!field.value?.trim()) return null;
          if (field.type === "richtext") {
            return <div key={field.key} className="prose prose-sm max-w-none text-foreground" dangerouslySetInnerHTML={{ __html: field.value }} />;
          }
          if (field.key.includes("title") || field.key.includes("heading")) {
            return <h2 key={field.key} className="text-xl font-bold text-foreground">{field.value}</h2>;
          }
          if (field.key.includes("subtitle")) {
            return <h3 key={field.key} className="text-lg font-semibold text-muted-foreground">{field.value}</h3>;
          }
          if (field.key.includes("cta")) {
            return (
              <div key={field.key}>
                <span className="inline-block px-5 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm">{field.value}</span>
              </div>
            );
          }
          if (field.key.includes("email")) {
            return <p key={field.key} className="text-sm text-primary">{field.value}</p>;
          }
          if (field.type === "textarea") {
            return <p key={field.key} className="text-sm text-muted-foreground whitespace-pre-line">{field.value}</p>;
          }
          return <p key={field.key} className="text-sm text-foreground">{field.value}</p>;
        })}
      </div>
    </div>
  );
};

const AdminPageEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [activeTab, setActiveTab] = useState("content");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [pageData, setPageData] = useState<PageData>({
    title: "", slug: "", content: null, status: "draft",
    meta_title: null, meta_description: null, components: {},
    hero_image: null, hero_overlay: 50,
  });
  const [heroUploading, setHeroUploading] = useState(false);
  const [fields, setFields] = useState<ContentField[]>([]);
  const [customFields, setCustomFields] = useState<ContentField[]>([]);
  const [focusKeyword, setFocusKeyword] = useState("");
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load page data
  useEffect(() => {
    if (!id) {
      setFields(getSchemaForSlug("default"));
      setLoading(false);
      return;
    }
    const load = async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) {
        toast.error("Page not found");
        navigate("/admin/pages");
        return;
      }
      setPageData({
        id: data.id,
        title: data.title,
        slug: data.slug,
        content: data.content,
        status: data.status,
        meta_title: data.meta_title,
        meta_description: data.meta_description,
        components: (data.components as Record<string, boolean>) || {},
        hero_image: data.hero_image || null,
        hero_overlay: data.hero_overlay ?? 50,
      });

      // Parse content JSON into fields
      const schema = getSchemaForSlug(data.slug);
      let contentObj: Record<string, string> = {};
      try {
        contentObj = data.content ? JSON.parse(data.content) : {};
      } catch { contentObj = {}; }

      const populatedFields = schema.map((f) => ({
        ...f,
        value: contentObj[f.key] || "",
      }));
      setFields(populatedFields);

      // Load any custom fields not in the schema
      const schemaKeys = new Set(schema.map((f) => f.key));
      const extras: ContentField[] = Object.entries(contentObj)
        .filter(([k]) => !schemaKeys.has(k))
        .map(([k, v]) => ({ key: k, label: k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), type: "text" as const, value: v }));
      setCustomFields(extras);

      setLoading(false);
    };
    load();
  }, [id, navigate]);

  // Update slug when title changes (new pages only)
  useEffect(() => {
    if (!pageData.id && pageData.title) {
      const slug = pageData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      setPageData((p) => ({ ...p, slug }));
    }
  }, [pageData.title, pageData.id]);

  // When slug changes, update schema fields
  useEffect(() => {
    if (!pageData.id) {
      const schema = getSchemaForSlug(pageData.slug);
      setFields((prev) => {
        const prevMap: Record<string, string> = {};
        prev.forEach((f) => { prevMap[f.key] = f.value; });
        return schema.map((f) => ({ ...f, value: prevMap[f.key] || "" }));
      });
    }
  }, [pageData.slug, pageData.id]);

  // Autosave draft every 30 seconds
  const buildContentJson = useCallback(() => {
    const obj: Record<string, string> = {};
    [...fields, ...customFields].forEach((f) => {
      if (f.value) obj[f.key] = f.value;
    });
    return JSON.stringify(obj);
  }, [fields, customFields]);

  useEffect(() => {
    if (!pageData.id) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      const contentJson = buildContentJson();
      await supabase.from("pages").update({ content: contentJson }).eq("id", pageData.id!);
      setLastSaved(new Date());
    }, 30000);
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current); };
  }, [fields, customFields, pageData.id, buildContentJson]);

  const updateField = (key: string, value: string, isCustom = false) => {
    if (isCustom) {
      setCustomFields((prev) => prev.map((f) => f.key === key ? { ...f, value } : f));
    } else {
      setFields((prev) => prev.map((f) => f.key === key ? { ...f, value } : f));
    }
  };

  const addCustomField = () => {
    const key = `custom_${Date.now()}`;
    setCustomFields((prev) => [...prev, { key, label: "New Field", type: "text", value: "" }]);
  };

  const removeCustomField = (key: string) => {
    setCustomFields((prev) => prev.filter((f) => f.key !== key));
  };

  const handleSave = async () => {
    if (!pageData.title?.trim()) { toast.error("Title is required."); return; }
    if (!pageData.slug?.trim()) { toast.error("Slug is required."); return; }
    setSaving(true);
    try {
      const contentJson = buildContentJson();
      const payload = {
        title: pageData.title.trim(),
        slug: pageData.slug.trim(),
        content: contentJson,
        status: pageData.status || "draft",
        meta_title: pageData.meta_title || null,
        meta_description: pageData.meta_description || null,
        components: pageData.components || {},
        hero_image: pageData.hero_image || null,
        hero_overlay: pageData.hero_overlay ?? 50,
      };

      if (pageData.id) {
        const { error } = await supabase.from("pages").update(payload).eq("id", pageData.id);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ["dynamic-page"] });
        queryClient.invalidateQueries({ queryKey: ["pages"] });
        queryClient.invalidateQueries({ queryKey: ["page-seo"] });
        toast.success("Page saved!");
      } else {
        const { data, error } = await supabase.from("pages").insert(payload).select().single();
        if (error) {
          if (error.message?.includes("duplicate")) toast.error("A page with this slug already exists.");
          else throw error;
          setSaving(false);
          return;
        }
        toast.success("Page created!");
        queryClient.invalidateQueries({ queryKey: ["dynamic-page"] });
        queryClient.invalidateQueries({ queryKey: ["pages"] });
        queryClient.invalidateQueries({ queryKey: ["page-seo"] });
        navigate(`/admin/pages/${data.id}/edit`, { replace: true });
      }
      setLastSaved(new Date());
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const renderField = (field: ContentField, isCustom = false) => (
    <div key={field.key}>
      <div className="flex items-center justify-between">
        {isCustom ? (
          <Input
            value={field.label}
            onChange={(e) => {
              const newKey = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
              setCustomFields((prev) => prev.map((f) => f.key === field.key ? { ...f, label: e.target.value, key: newKey || field.key } : f));
            }}
            className="text-sm font-medium h-auto py-0 px-0 border-none shadow-none bg-transparent w-48"
          />
        ) : (
          <Label className="text-sm font-medium">{field.label}</Label>
        )}
        {isCustom && (
          <button onClick={() => removeCustomField(field.key)} className="p-1 text-muted-foreground hover:text-destructive">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {field.type === "richtext" ? (
        <RichTextField value={field.value} onChange={(v) => updateField(field.key, v, isCustom)} />
      ) : field.type === "textarea" ? (
        <textarea
          value={field.value}
          onChange={(e) => updateField(field.key, e.target.value, isCustom)}
          rows={3}
          className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      ) : (
        <Input
          value={field.value}
          onChange={(e) => updateField(field.key, e.target.value, isCustom)}
          className="mt-1.5"
        />
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/pages")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {pageData.id ? `Edit: ${pageData.title || "Untitled"}` : "New Page"}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Update text, images, and SEO here. Use clear headings and short descriptions for a more professional page.
            </p>
          </div>
          {lastSaved && (
            <span className="text-xs text-muted-foreground">
              Auto-saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="gap-1.5">
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? "Hide Preview" : "Live Preview"}
          </Button>
          <Select value={pageData.status} onValueChange={(v) => setPageData({ ...pageData, status: v })}>
            <SelectTrigger className="w-28 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Page
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background p-5">
        <h3 className="text-sm font-semibold text-foreground">Editing guide</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3 text-sm">
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="font-medium text-foreground">Content Fields</p>
            <p className="text-muted-foreground mt-1">Use this for page text, headings, button labels, and descriptions.</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="font-medium text-foreground">Hero Image</p>
            <p className="text-muted-foreground mt-1">Upload a professional banner image and adjust the dark overlay for readable text.</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="font-medium text-foreground">SEO</p>
            <p className="text-muted-foreground mt-1">Set the page title and description that appear in Google and social sharing previews.</p>
          </div>
        </div>
      </div>

      <div className={`grid gap-6 ${showPreview ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
        {/* Editor */}
        <div className="space-y-6">
          {/* Page Info */}
          <div className="bg-background rounded-xl border border-border p-5 space-y-4">
            <div>
              <Label>Page Title *</Label>
              <Input
                value={pageData.title}
                onChange={(e) => setPageData({ ...pageData, title: e.target.value })}
                placeholder="Page title"
                className="mt-1.5 text-lg font-semibold"
              />
            </div>
            <div>
              <Label>Slug *</Label>
              <div className="flex items-center gap-1 mt-1.5">
                <span className="text-sm text-muted-foreground">/</span>
                <Input
                  value={pageData.slug}
                  onChange={(e) => setPageData({ ...pageData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                  placeholder="page-slug"
                  className="font-mono"
                />
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="content">Text & Sections</TabsTrigger>
              <TabsTrigger value="hero">Hero Banner</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="components">Components</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="mt-4">
              <div className="bg-background rounded-xl border border-border p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Content Sections</h3>
                    <p className="text-xs text-muted-foreground">Edit each section of the page individually.</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">{fields.length + customFields.length} fields</Badge>
                </div>

                <div className="space-y-5">
                  {fields.map((f) => renderField(f, false))}
                </div>

                {customFields.length > 0 && (
                  <div className="border-t border-border pt-5 space-y-5">
                    <h4 className="text-sm font-semibold text-foreground">Custom Fields</h4>
                    {customFields.map((f) => renderField(f, true))}
                  </div>
                )}

                <Button variant="outline" size="sm" onClick={addCustomField} className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add Custom Field
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="hero" className="mt-4">
              <div className="bg-background rounded-xl border border-border p-5 space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Page Hero Background</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Upload a unique hero background image for this page. If empty, the global hero image (or primary color) will be used.
                  </p>
                </div>

                {pageData.hero_image ? (
                  <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden border border-border" style={{ minHeight: 200 }}>
                      <img src={toBrandedUrl(pageData.hero_image)} alt="Hero background" className="w-full h-48 object-cover" />
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ backgroundColor: `rgba(0,0,0,${pageData.hero_overlay / 100})` }}
                      >
                        <span className="text-primary-foreground text-xl font-bold">{pageData.title || "Preview Title"}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <label className="cursor-pointer">
                        <Button variant="outline" size="sm" className="gap-1 pointer-events-none">
                          <Upload className="w-3.5 h-3.5" /> Replace Image
                        </Button>
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 10 * 1024 * 1024) { toast.error("File must be under 10MB."); return; }
                          setHeroUploading(true);
                          try {
                            const uploaded = await uploadLocalMedia({
                              file,
                              pathPrefix: "page-hero",
                              slug: `page-hero-${pageData.slug || "page"}-${Date.now()}-${file.name}`,
                              fileName: `page hero ${pageData.slug || "page"}`,
                              altText: `${pageData.title || "page"} hero image`,
                            });
                            setPageData(p => ({ ...p, hero_image: uploaded.url }));
                            toast.success("Image uploaded! Click Save to apply.");
                          } catch { toast.error("Failed to upload image."); }
                          finally { setHeroUploading(false); }
                        }} disabled={heroUploading} />
                      </label>
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => setPageData(p => ({ ...p, hero_image: null }))}>
                        <X className="w-3.5 h-3.5" /> Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-8 cursor-pointer hover:border-primary/50 transition-colors">
                    {heroUploading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Click to upload hero background image</span>
                        <span className="text-xs text-muted-foreground mt-1">JPG, PNG or WebP, max 10MB</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 10 * 1024 * 1024) { toast.error("File must be under 10MB."); return; }
                      setHeroUploading(true);
                      try {
                        const uploaded = await uploadLocalMedia({
                          file,
                          pathPrefix: "page-hero",
                          slug: `page-hero-${pageData.slug || "page"}-${Date.now()}-${file.name}`,
                          fileName: `page hero ${pageData.slug || "page"}`,
                          altText: `${pageData.title || "page"} hero image`,
                        });
                        setPageData(p => ({ ...p, hero_image: uploaded.url }));
                        toast.success("Image uploaded! Click Save to apply.");
                      } catch { toast.error("Failed to upload image."); }
                      finally { setHeroUploading(false); }
                    }} disabled={heroUploading} />
                  </label>
                )}

                <div className="border-t border-border pt-5">
                  <Label className="text-sm font-medium text-foreground">Dark Overlay Opacity: {pageData.hero_overlay}%</Label>
                  <p className="text-xs text-muted-foreground mb-3">Adjust the dark overlay to ensure the page title is readable.</p>
                  <Slider
                    value={[pageData.hero_overlay]}
                    onValueChange={(v) => setPageData(p => ({ ...p, hero_overlay: v[0] }))}
                    min={0}
                    max={100}
                    step={1}
                    className="max-w-md"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="seo" className="mt-4">
              <AdvancedSEOSidebar
                data={{
                  focusKeyword: focusKeyword,
                  metaTitle: pageData.meta_title || "",
                  metaDescription: pageData.meta_description || "",
                  slug: pageData.slug,
                  content: buildContentJson(),
                  postTitle: pageData.title,
                  urlPrefix: "/",
                }}
                focusKeyword={focusKeyword}
                metaTitle={pageData.meta_title || ""}
                metaDescription={pageData.meta_description || ""}
                onFocusKeywordChange={setFocusKeyword}
                onMetaTitleChange={(v) => setPageData({ ...pageData, meta_title: v })}
                onMetaDescriptionChange={(v) => setPageData({ ...pageData, meta_description: v })}
                onSlugChange={(v) => setPageData({ ...pageData, slug: v })}
              />
            </TabsContent>

            <TabsContent value="components" className="mt-4">
              <div className="bg-background rounded-xl border border-border p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Page Components</h3>
                  <p className="text-xs text-muted-foreground mb-4">Attach dynamic sections to the bottom of this page.</p>
                </div>
                <div className="space-y-3">
                  {([
                    { key: "work_samples", label: "Display Work Samples (Portfolio)" },
                    { key: "testimonials", label: "Display Testimonials (Social Proof)" },
                    { key: "faqs", label: "Display FAQs (Help Section)" },
                  ] as const).map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                      <Checkbox
                        checked={!!pageData.components[key]}
                        onCheckedChange={(v) => setPageData({
                          ...pageData,
                          components: { ...pageData.components, [key]: !!v },
                        })}
                      />
                      <Label className="text-sm font-normal cursor-pointer">{label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Preview */}
        {showPreview && (
          <div className="sticky top-24">
            <LivePreview fields={[...fields, ...customFields]} title={pageData.title || "Untitled"} heroImage={pageData.hero_image} heroOverlay={pageData.hero_overlay} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPageEditor;
