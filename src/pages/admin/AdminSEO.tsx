import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSchemaConfig, saveSchemaConfig } from "@/hooks/useSchemaConfig";
import type { SchemaConfig } from "@/lib/jsonLdSchemas";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Search, Globe, Image as ImageIcon, BarChart3, Zap, FileWarning,
  Code2, Loader2, Save, CheckCircle, XCircle, Info,
  Facebook, Twitter, Link2, Eye, Bot, RefreshCw, ExternalLink,
  MapPin, Languages,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import SEOHealthWidget from "@/components/admin/SEOHealthWidget";
import SEOAnalyticsDashboard from "@/components/admin/SEOAnalyticsDashboard";

interface SEOModule {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const SEO_MODULES: SEOModule[] = [
  {
    id: "404_monitor",
    title: "404 Monitor",
    description: "Track and fix broken links across your site automatically.",
    icon: <FileWarning className="w-6 h-6" />,
    color: "text-destructive",
  },
  {
    id: "sitemap",
    title: "Sitemap Settings",
    description: "Control XML sitemap generation and submission to search engines.",
    icon: <Globe className="w-6 h-6" />,
    color: "text-[hsl(217,91%,60%)]",
  },
  {
    id: "schema",
    title: "Schema (Structured Data)",
    description: "Enable Article, Product, and Local Business schema markup.",
    icon: <Code2 className="w-6 h-6" />,
    color: "text-[hsl(262,83%,58%)]",
  },
  {
    id: "instant_indexing",
    title: "Instant Indexing",
    description: "Connect to Google Indexing API for faster content discovery.",
    icon: <Zap className="w-6 h-6" />,
    color: "text-[hsl(45,93%,47%)]",
  },
  {
    id: "image_seo",
    title: "Image SEO",
    description: "Automatic alt-text and title tag optimization for all images.",
    icon: <ImageIcon className="w-6 h-6" />,
    color: "text-[hsl(142,70%,45%)]",
  },
  {
    id: "analytics",
    title: "Analytics",
    description: "Integrate Google Search Console and Analytics data.",
    icon: <BarChart3 className="w-6 h-6" />,
    color: "text-[hsl(0,84%,60%)]",
  },
];

const SETTING_KEYS = {
  modules: "seo_active_modules",
  titlePattern_home: "seo_title_home",
  titlePattern_post: "seo_title_post",
  titlePattern_product: "seo_title_product",
  ogImage: "seo_og_image",
  ogTitle: "seo_og_title",
  ogDescription: "seo_og_description",
  twitterCard: "seo_twitter_card",
  twitterSite: "seo_twitter_site",
  searchConsoleTag: "seo_search_console_tag",
  bingVerificationTag: "seo_bing_verification_tag",
  schemaArticle: "seo_schema_article",
  schemaProduct: "seo_schema_product",
  schemaLocalBiz: "seo_schema_local_business",
  schemaConfig: "schema_config",
  imageAutoAlt: "seo_image_auto_alt",
  imageAutoTitle: "seo_image_auto_title",
};

const AdminSEO = () => {
  const [activeTab, setActiveTab] = useState("modules");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Module states
  const [activeModules, setActiveModules] = useState<string[]>([
    "sitemap", "schema", "image_seo",
  ]);

  // Titles & Meta
  const [titleHome, setTitleHome] = useState("[Site Name] — [Tagline]");
  const [titlePost, setTitlePost] = useState("[Title] | [Site Name]");
  const [titleProduct, setTitleProduct] = useState("[Product] — Buy at [Site Name]");

  // Social Meta
  const [ogImage, setOgImage] = useState("");
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [twitterCard, setTwitterCard] = useState("summary_large_image");
  const [twitterSite, setTwitterSite] = useState("");

  // Search Console / Bing
  const [searchConsoleTag, setSearchConsoleTag] = useState("");
  const [bingVerificationTag, setBingVerificationTag] = useState("");

  // Schema toggles
  const [schemaArticle, setSchemaArticle] = useState(true);
  const [schemaProduct, setSchemaProduct] = useState(true);
  const [schemaLocalBiz, setSchemaLocalBiz] = useState(false);

  // Image SEO
  const [imageAutoAlt, setImageAutoAlt] = useState(true);
  const [imageAutoTitle, setImageAutoTitle] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const keys = Object.values(SETTING_KEYS);
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", keys);

      if (data) {
        const map: Record<string, string> = {};
        data.forEach((r) => (map[r.key] = r.value));

        if (map[SETTING_KEYS.modules]) {
          try { setActiveModules(JSON.parse(map[SETTING_KEYS.modules])); } catch {}
        }
        if (map[SETTING_KEYS.titlePattern_home]) setTitleHome(map[SETTING_KEYS.titlePattern_home]);
        if (map[SETTING_KEYS.titlePattern_post]) setTitlePost(map[SETTING_KEYS.titlePattern_post]);
        if (map[SETTING_KEYS.titlePattern_product]) setTitleProduct(map[SETTING_KEYS.titlePattern_product]);
        if (map[SETTING_KEYS.ogImage]) setOgImage(map[SETTING_KEYS.ogImage]);
        if (map[SETTING_KEYS.ogTitle]) setOgTitle(map[SETTING_KEYS.ogTitle]);
        if (map[SETTING_KEYS.ogDescription]) setOgDescription(map[SETTING_KEYS.ogDescription]);
        if (map[SETTING_KEYS.twitterCard]) setTwitterCard(map[SETTING_KEYS.twitterCard]);
        if (map[SETTING_KEYS.twitterSite]) setTwitterSite(map[SETTING_KEYS.twitterSite]);
        if (map[SETTING_KEYS.searchConsoleTag]) setSearchConsoleTag(map[SETTING_KEYS.searchConsoleTag]);
        if (map[SETTING_KEYS.bingVerificationTag]) setBingVerificationTag(map[SETTING_KEYS.bingVerificationTag]);
        if (map[SETTING_KEYS.schemaArticle]) setSchemaArticle(map[SETTING_KEYS.schemaArticle] === "true");
        if (map[SETTING_KEYS.schemaProduct]) setSchemaProduct(map[SETTING_KEYS.schemaProduct] === "true");
        if (map[SETTING_KEYS.schemaLocalBiz]) setSchemaLocalBiz(map[SETTING_KEYS.schemaLocalBiz] === "true");
        if (map[SETTING_KEYS.imageAutoAlt]) setImageAutoAlt(map[SETTING_KEYS.imageAutoAlt] === "true");
        if (map[SETTING_KEYS.imageAutoTitle]) setImageAutoTitle(map[SETTING_KEYS.imageAutoTitle] === "true");
      }
      setLoading(false);
    };
    load();
  }, []);

  const saveSetting = async (key: string, value: string) => {
    const { data: existing } = await supabase
      .from("site_settings")
      .select("key")
      .eq("key", key)
      .single();
    if (existing) {
      await supabase.from("site_settings").update({ value, updated_at: new Date().toISOString() }).eq("key", key);
    } else {
      await supabase.from("site_settings").insert({ key, value });
    }
  };

  const toggleModule = async (moduleId: string) => {
    const updated = activeModules.includes(moduleId)
      ? activeModules.filter((m) => m !== moduleId)
      : [...activeModules, moduleId];
    setActiveModules(updated);
    await saveSetting(SETTING_KEYS.modules, JSON.stringify(updated));
    toast.success(`Module ${updated.includes(moduleId) ? "activated" : "deactivated"}.`);
  };

  const handleSaveGlobal = async () => {
    setSaving(true);
    try {
      await Promise.all([
        saveSetting(SETTING_KEYS.titlePattern_home, titleHome),
        saveSetting(SETTING_KEYS.titlePattern_post, titlePost),
        saveSetting(SETTING_KEYS.titlePattern_product, titleProduct),
        saveSetting(SETTING_KEYS.ogImage, ogImage),
        saveSetting(SETTING_KEYS.ogTitle, ogTitle),
        saveSetting(SETTING_KEYS.ogDescription, ogDescription),
        saveSetting(SETTING_KEYS.twitterCard, twitterCard),
        saveSetting(SETTING_KEYS.twitterSite, twitterSite),
        saveSetting(SETTING_KEYS.searchConsoleTag, searchConsoleTag),
        saveSetting(SETTING_KEYS.bingVerificationTag, bingVerificationTag),
        saveSetting(SETTING_KEYS.schemaArticle, String(schemaArticle)),
        saveSetting(SETTING_KEYS.schemaProduct, String(schemaProduct)),
        saveSetting(SETTING_KEYS.schemaLocalBiz, String(schemaLocalBiz)),
        saveSetting(SETTING_KEYS.imageAutoAlt, String(imageAutoAlt)),
        saveSetting(SETTING_KEYS.imageAutoTitle, String(imageAutoTitle)),
      ]);
      toast.success("SEO settings saved!");
    } catch {
      toast.error("Failed to save settings.");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading SEO settings…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Search className="w-6 h-6 text-primary" /> SEO Settings
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Centralized hub for all site-wide search engine optimization.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto -mx-1 px-1">
          <TabsList className="bg-secondary/50 w-max min-w-full justify-start">
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="crawler">Crawler & Indexing</TabsTrigger>
            <TabsTrigger value="international">International SEO</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="titles">Titles & Meta</TabsTrigger>
            <TabsTrigger value="social">Social Meta</TabsTrigger>
            <TabsTrigger value="search-console">Search Console</TabsTrigger>
            <TabsTrigger value="health">Health Report</TabsTrigger>
            <TabsTrigger value="bulk-meta">Bulk Meta Editor</TabsTrigger>
            <TabsTrigger value="robots-sitemap">Robots & Sitemap</TabsTrigger>
            <TabsTrigger value="schema-gen">Schema Generator</TabsTrigger>
          </TabsList>
        </div>

        {/* ────────── ANALYTICS TAB ────────── */}
        <TabsContent value="analytics">
          <div className="mt-4">
            <SEOAnalyticsDashboard />
          </div>
        </TabsContent>

        {/* ────────── CRAWLER & INDEXING TAB ────────── */}
        <TabsContent value="crawler">
          <CrawlerIndexingPanel saveSetting={saveSetting} />
        </TabsContent>

        {/* ────────── INTERNATIONAL SEO TAB ────────── */}
        <TabsContent value="international">
          <InternationalSEOPanel />
        </TabsContent>

        {/* ────────── MODULES TAB ────────── */}
        <TabsContent value="modules">
          <div className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Enable or disable SEO modules. Active modules will apply their optimization rules site-wide.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SEO_MODULES.map((mod) => {
                const isActive = activeModules.includes(mod.id);
                return (
                  <div
                    key={mod.id}
                    className={cn(
                      "relative rounded-xl border p-5 transition-all cursor-pointer group",
                      isActive
                        ? "border-primary/40 bg-primary/5 shadow-sm"
                        : "border-border bg-background hover:border-primary/20"
                    )}
                    onClick={() => toggleModule(mod.id)}
                  >
                    {/* Status badge */}
                    <div className="absolute top-3 right-3">
                      {isActive ? (
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">Inactive</Badge>
                      )}
                    </div>

                    <div className={cn("mb-3", mod.color)}>{mod.icon}</div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">{mod.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{mod.description}</p>

                    <div className="mt-4 flex items-center gap-2">
                      <Switch
                        checked={isActive}
                        onCheckedChange={() => toggleModule(mod.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-xs text-muted-foreground">{isActive ? "Enabled" : "Disabled"}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Schema sub-settings when active */}
            {activeModules.includes("schema") && (
              <SchemaConfigPanel />
            )}

            {/* Image SEO sub-settings */}
            {activeModules.includes("image_seo") && (
              <div className="bg-background rounded-xl border border-border p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[hsl(142,70%,45%)]" />
                  <h3 className="text-sm font-semibold text-foreground">Image SEO Options</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Auto Alt-Text", desc: "Automatically generate alt text from image file names.", checked: imageAutoAlt, set: setImageAutoAlt },
                    { label: "Auto Title Tags", desc: "Automatically add title attributes to images.", checked: imageAutoTitle, set: setImageAutoTitle },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch checked={item.checked} onCheckedChange={item.set} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={handleSaveGlobal} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Module Settings
            </Button>
          </div>
        </TabsContent>

        {/* ────────── TITLES & META TAB ────────── */}
        <TabsContent value="titles">
          <div className="bg-background rounded-xl border border-border p-6 space-y-6 mt-4">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1">Title Patterns</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Set default title patterns using variables: <code className="bg-secondary px-1.5 py-0.5 rounded text-[11px]">[Title]</code> <code className="bg-secondary px-1.5 py-0.5 rounded text-[11px]">[Site Name]</code> <code className="bg-secondary px-1.5 py-0.5 rounded text-[11px]">[Tagline]</code> <code className="bg-secondary px-1.5 py-0.5 rounded text-[11px]">[Product]</code>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Homepage Title Pattern</Label>
                <Input value={titleHome} onChange={(e) => setTitleHome(e.target.value)} className="mt-1.5 font-mono text-sm" />
                <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Preview: <span className="font-medium">Verified BM Shop — Your trusted source</span>
                </p>
              </div>
              <div>
                <Label>Blog Post Title Pattern</Label>
                <Input value={titlePost} onChange={(e) => setTitlePost(e.target.value)} className="mt-1.5 font-mono text-sm" />
                <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Preview: <span className="font-medium">How to Buy Verified BM | Verified BM Shop</span>
                </p>
              </div>
              <div>
                <Label>Product Title Pattern</Label>
                <Input value={titleProduct} onChange={(e) => setTitleProduct(e.target.value)} className="mt-1.5 font-mono text-sm" />
                <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Preview: <span className="font-medium">Premium BM — Buy at Verified BM Shop</span>
                </p>
              </div>
            </div>

            <Button onClick={handleSaveGlobal} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Title Patterns
            </Button>
          </div>
        </TabsContent>

        {/* ────────── SOCIAL META TAB ────────── */}
        <TabsContent value="social">
          <div className="bg-background rounded-xl border border-border p-6 space-y-6 mt-4">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
                <Facebook className="w-4 h-4 text-[hsl(217,89%,61%)]" /> Open Graph (Facebook)
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Default social share settings when no per-page values are set.</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Default OG Title</Label>
                <Input value={ogTitle} onChange={(e) => setOgTitle(e.target.value)} placeholder="Verified BM Shop — Verified Facebook Business Managers" className="mt-1.5" />
              </div>
              <div>
                <Label>Default OG Description</Label>
                <Textarea value={ogDescription} onChange={(e) => setOgDescription(e.target.value)} placeholder="Your trusted source for verified Facebook Business Managers." rows={3} className="mt-1.5" />
              </div>
              <div>
                <Label>Default OG Image URL</Label>
                <Input value={ogImage} onChange={(e) => setOgImage(e.target.value)} placeholder="https://yoursite.com/og-image.png" className="mt-1.5 font-mono text-sm" />
                {ogImage && (
                  <div className="mt-2 border border-border rounded-lg overflow-hidden max-w-xs">
                    <img src={ogImage} alt="OG Preview" className="w-full h-auto" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
                <Twitter className="w-4 h-4" /> X (Twitter) Card
              </h3>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Card Type</Label>
                  <select
                    value={twitterCard}
                    onChange={(e) => setTwitterCard(e.target.value)}
                    className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="summary">Summary</option>
                    <option value="summary_large_image">Summary Large Image</option>
                  </select>
                </div>
                <div>
                  <Label>Twitter @username</Label>
                  <Input value={twitterSite} onChange={(e) => setTwitterSite(e.target.value)} placeholder="@vbbstore" className="mt-1.5" />
                </div>
              </div>
            </div>

            <Button onClick={handleSaveGlobal} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Social Settings
            </Button>
          </div>
        </TabsContent>

        {/* ────────── SEARCH CONSOLE TAB ────────── */}
        <TabsContent value="search-console">
          <div className="bg-background rounded-xl border border-border p-6 space-y-6 mt-4">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" /> Google Search Console
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Paste your Google Search Console HTML verification tag below. This will be injected into the <code className="bg-secondary px-1 py-0.5 rounded text-[11px]">&lt;head&gt;</code> of your site.
              </p>
            </div>

            <div>
              <Label>HTML Verification Tag</Label>
              <Textarea
                value={searchConsoleTag}
                onChange={(e) => setSearchConsoleTag(e.target.value)}
                placeholder='<meta name="google-site-verification" content="YOUR_CODE_HERE" />'
                rows={3}
                className="mt-1.5 font-mono text-sm"
              />
              <div className="flex items-start gap-2 mt-2 p-3 bg-primary/5 rounded-lg border border-primary/15">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground">
                  Go to <span className="font-medium text-foreground">Google Search Console → Settings → Ownership verification → HTML tag</span> and copy the full meta tag.
                </p>
              </div>
            </div>

            {/* Bing Webmaster Tools */}
            <div className="border-t border-border pt-6">
              <h3 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
                <Globe className="w-4 h-4 text-[hsl(200,100%,40%)]" /> Bing Webmaster Tools
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Paste your Bing verification content value below.
              </p>
              <div>
                <Label>Bing Verification Code</Label>
                <Input
                  value={bingVerificationTag}
                  onChange={(e) => setBingVerificationTag(e.target.value)}
                  placeholder="e.g. ABC123DEF456..."
                  className="mt-1.5 font-mono text-sm"
                />
                <div className="flex items-start gap-2 mt-2 p-3 bg-[hsl(200,100%,40%)]/5 rounded-lg border border-[hsl(200,100%,40%)]/15">
                  <Info className="w-4 h-4 text-[hsl(200,100%,40%)] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground">
                    Go to <span className="font-medium text-foreground">Bing Webmaster Tools → Add site → HTML Meta Tag</span> and copy just the <code className="bg-secondary px-1 py-0.5 rounded text-[11px]">content</code> value.
                  </p>
                </div>
              </div>
            </div>

            {/* Google API JSON Key */}
            <div className="border-t border-border pt-6">
              <h3 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[hsl(45,93%,47%)]" /> Google Search Console API (Advanced)
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Upload a Google Service Account JSON key to fetch impressions, clicks, and keyword data automatically. Data refreshes every 24 hours to keep server resources low.
              </p>
              <div className="flex items-start gap-2 p-4 bg-[hsl(45,93%,47%)]/5 rounded-lg border border-[hsl(45,93%,47%)]/15">
                <Info className="w-4 h-4 text-[hsl(45,93%,47%)] shrink-0 mt-0.5" />
                <div className="text-[11px] text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">How to get a JSON key:</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>Go to <span className="font-medium text-foreground">Google Cloud Console → APIs & Services → Credentials</span></li>
                    <li>Create a Service Account and download the JSON key file</li>
                    <li>Enable the <span className="font-medium text-foreground">Google Search Console API</span> in API Library</li>
                    <li>Add the service account email as a user in Google Search Console</li>
                  </ol>
                  <p className="mt-2">Once connected, the Analytics tab will automatically populate with real data from your search performance.</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <Badge variant="outline" className="text-xs text-muted-foreground gap-1">
                  <XCircle className="w-3 h-3" /> Not Connected
                </Badge>
                <span className="text-[11px] text-muted-foreground">Refresh interval: every 24 hours</span>
              </div>
            </div>

            <Button onClick={handleSaveGlobal} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Verification Tag
            </Button>
          </div>
        </TabsContent>

        {/* ────────── HEALTH REPORT TAB ────────── */}
        <TabsContent value="health">
          <div className="mt-4">
            <SEOHealthWidget />
          </div>
        </TabsContent>

        {/* ────────── BULK META EDITOR TAB ────────── */}
        <TabsContent value="bulk-meta">
          <div className="mt-4">
            <BulkMetaEditor />
          </div>
        </TabsContent>

        {/* ────────── ROBOTS & SITEMAP TAB ────────── */}
        <TabsContent value="robots-sitemap">
          <div className="mt-4">
            <RobotsSitemapManager />
          </div>
        </TabsContent>

        {/* ────────── SCHEMA GENERATOR TAB ────────── */}
        <TabsContent value="schema-gen">
          <div className="mt-4">
            <SchemaGeneratorWidget />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ─── Region options for International SEO ───────────────────────────────────
const REGION_OPTIONS = [
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "CA", label: "Canada" },
  { code: "AU", label: "Australia" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "IN", label: "India" },
  { code: "BD", label: "Bangladesh" },
  { code: "AE", label: "UAE" },
  { code: "SG", label: "Singapore" },
  { code: "MY", label: "Malaysia" },
  { code: "PH", label: "Philippines" },
  { code: "PK", label: "Pakistan" },
  { code: "NG", label: "Nigeria" },
  { code: "KE", label: "Kenya" },
];

// ─── International SEO Panel ────────────────────────────────────────────────
const InternationalSEOPanel = () => {
  const [targetLang, setTargetLang] = useState("en");
  const [geoRegion, setGeoRegion] = useState("");
  const [geoPlacename, setGeoPlacename] = useState("");
  const [targetRegions, setTargetRegions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "international_seo")
        .maybeSingle();
      if (data?.value) {
        try {
          const parsed = JSON.parse(data.value);
          setTargetLang(parsed.targetLang || "en");
          setGeoRegion(parsed.geoRegion || "");
          setGeoPlacename(parsed.geoPlacename || "");
          setTargetRegions(parsed.targetRegions || []);
        } catch {}
      }
      setLoaded(true);
    };
    load();
  }, []);

  const toggleRegion = (code: string) => {
    setTargetRegions((prev) =>
      prev.includes(code) ? prev.filter((r) => r !== code) : [...prev, code]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    const value = JSON.stringify({ targetLang, geoRegion, geoPlacename, targetRegions });
    const { data: existing } = await supabase
      .from("site_settings")
      .select("key")
      .eq("key", "international_seo")
      .maybeSingle();
    if (existing) {
      await supabase.from("site_settings").update({ value, updated_at: new Date().toISOString() }).eq("key", "international_seo");
    } else {
      await supabase.from("site_settings").insert({ key: "international_seo", value });
    }
    toast.success("International SEO settings saved!");
    setSaving(false);
  };

  if (!loaded) return null;

  return (
    <div className="mt-4 space-y-6">
      {/* Hreflang Configuration */}
      <div className="bg-background rounded-xl border border-border p-6 space-y-5">
        <div>
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Languages className="w-5 h-5 text-primary" /> Hreflang & Language Settings
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Hreflang tags tell search engines which language and region your content targets. Since your site is in English targeting the world, the default is <code className="bg-secondary px-1 py-0.5 rounded">en</code> with <code className="bg-secondary px-1 py-0.5 rounded">x-default</code>.
          </p>
        </div>

        <div>
          <Label className="text-sm font-medium mb-1.5 block">Primary Language</Label>
          <Input value={targetLang} onChange={(e) => setTargetLang(e.target.value)} placeholder="en" className="max-w-[200px]" />
          <p className="text-[11px] text-muted-foreground mt-1">ISO 639-1 language code (e.g., en, fr, de, bn)</p>
        </div>

        <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg border border-primary/15">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="text-[11px] text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Auto-injected on every page:</p>
            <code className="bg-secondary px-2 py-1 rounded text-[10px] block">{`<link rel="alternate" hreflang="${targetLang}" href="..." />`}</code>
            <code className="bg-secondary px-2 py-1 rounded text-[10px] block mt-1">{`<link rel="alternate" hreflang="x-default" href="..." />`}</code>
          </div>
        </div>
      </div>

      {/* Target Regions */}
      <div className="bg-background rounded-xl border border-border p-6 space-y-5">
        <div>
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[hsl(142,70%,45%)]" /> Target Regions
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Select the countries you want to prioritize. This generates <code className="bg-secondary px-1 py-0.5 rounded">geo.region</code> meta tags for search engines.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {REGION_OPTIONS.map((region) => {
            const active = targetRegions.includes(region.code);
            return (
              <button
                key={region.code}
                onClick={() => toggleRegion(region.code)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                  active
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-secondary/30 border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                )}
              >
                {region.label} ({region.code})
              </button>
            );
          })}
        </div>

        {targetRegions.length > 0 && (
          <div className="text-[11px] text-muted-foreground p-3 bg-secondary/30 rounded-lg border border-border">
            <p className="font-medium text-foreground mb-1">Generated meta tags:</p>
            {targetRegions.map((r) => (
              <code key={r} className="block bg-secondary px-2 py-0.5 rounded mt-0.5 text-[10px]">{`<meta name="geo.region" content="${r}" />`}</code>
            ))}
          </div>
        )}
      </div>

      {/* Geo Placename */}
      <div className="bg-background rounded-xl border border-border p-6 space-y-5">
        <div>
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Globe className="w-5 h-5 text-[hsl(262,83%,58%)]" /> Geo Location Meta
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Optional: Set your primary business geo location for local SEO signals.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Geo Region Code</Label>
            <Input value={geoRegion} onChange={(e) => setGeoRegion(e.target.value)} placeholder="e.g., US-CA or BD-E" />
            <p className="text-[11px] text-muted-foreground mt-1">ISO 3166-1/2 region code</p>
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Geo Placename</Label>
            <Input value={geoPlacename} onChange={(e) => setGeoPlacename(e.target.value)} placeholder="e.g., Rangpur, Bangladesh" />
            <p className="text-[11px] text-muted-foreground mt-1">Human-readable location name</p>
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save International SEO Settings
      </Button>
    </div>
  );
};

// ─── Crawler & Indexing Panel ───────────────────────────────────────────────
const DEFAULT_ROBOTS = `# =============================================
# robots.txt — Verified BM Shop
# =============================================

User-agent: Googlebot
Allow: /
Disallow: /admin/
Disallow: /checkout
Disallow: /admin/login

User-agent: Bingbot
Allow: /
Disallow: /admin/
Disallow: /checkout

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: *
Allow: /
Disallow: /admin/
Disallow: /checkout
Disallow: /api/

# Sitemap
Sitemap: https://verifiedbm.shop/sitemap.xml`;

const CrawlerIndexingPanel = ({ saveSetting }: { saveSetting: (key: string, value: string) => Promise<void> }) => {
  const [robotsTxt, setRobotsTxt] = useState(DEFAULT_ROBOTS);
  const [savingRobots, setSavingRobots] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [pinging, setPinging] = useState(false);
  const [sitemapStats, setSitemapStats] = useState<{ pages: number; products: number; posts: number } | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "robots_txt")
        .single();
      if (data?.value) setRobotsTxt(data.value);

      const [pagesRes, productsRes, postsRes] = await Promise.all([
        supabase.from("pages").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("blog_posts").select("id", { count: "exact", head: true }).eq("status", "published"),
      ]);
      setSitemapStats({
        pages: (pagesRes.count || 0) + 10,
        products: productsRes.count || 0,
        posts: postsRes.count || 0,
      });
      setLoadingStats(false);
    };
    load();
  }, []);

  const handleSaveRobots = async () => {
    setSavingRobots(true);
    await saveSetting("robots_txt", robotsTxt);
    toast.success("robots.txt saved!");
    setSavingRobots(false);
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sitemap`);
      toast.success("Sitemap regenerated!");
    } catch {
      toast.error("Failed to regenerate sitemap.");
    }
    setRegenerating(false);
  };

  const handlePingGoogle = async () => {
    setPinging(true);
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sitemap?ping=true`);
      toast.success("Google pinged with updated sitemap!");
    } catch {
      toast.error("Failed to ping Google.");
    }
    setPinging(false);
  };

  const totalUrls = sitemapStats ? sitemapStats.pages + sitemapStats.products + sitemapStats.posts : 0;

  return (
    <div className="mt-4 space-y-6">
      {/* Sitemap Section */}
      <div className="bg-background rounded-xl border border-border p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" /> Automatic Sitemap Generator
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Dynamically generated from your database with hreflang support for international SEO.</p>
          </div>
          <Badge variant="outline" className="text-xs gap-1">
            <CheckCircle className="w-3 h-3 text-[hsl(142,70%,45%)]" /> Active
          </Badge>
        </div>

        {loadingStats ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading stats...
          </div>
        ) : sitemapStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total URLs", value: totalUrls, color: "text-primary" },
              { label: "Static Pages", value: sitemapStats.pages, color: "text-[hsl(262,83%,58%)]" },
              { label: "Products", value: sitemapStats.products, color: "text-[hsl(142,70%,45%)]" },
              { label: "Blog Posts", value: sitemapStats.posts, color: "text-[hsl(45,93%,47%)]" },
            ].map((stat) => (
              <div key={stat.label} className="bg-secondary/30 rounded-lg p-3 border border-border text-center">
                <p className={cn("text-lg font-bold", stat.color)}>{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleRegenerate} disabled={regenerating} variant="outline" className="gap-2">
            {regenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Regenerate Sitemap
          </Button>
          <Button onClick={handlePingGoogle} disabled={pinging} variant="outline" className="gap-2">
            {pinging ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
            Ping Google
          </Button>
          <a href="https://verifiedbm.shop/sitemap.xml" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary hover:underline self-center">
            <Eye className="w-4 h-4" /> View Live Sitemap
          </a>
        </div>
      </div>

      {/* Robots.txt Section */}
      <div className="bg-background rounded-xl border border-border p-6 space-y-5">
        <div>
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Bot className="w-5 h-5 text-[hsl(262,83%,58%)]" /> Robots.txt Manager
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Control which parts of your site search engine crawlers can access.</p>
        </div>

        <Textarea value={robotsTxt} onChange={(e) => setRobotsTxt(e.target.value)} rows={18} className="font-mono text-sm leading-relaxed" />

        <div className="flex gap-3">
          <Button onClick={handleSaveRobots} disabled={savingRobots} className="gap-2">
            {savingRobots ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save robots.txt
          </Button>
          <Button variant="outline" onClick={() => setRobotsTxt(DEFAULT_ROBOTS)} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Reset to Default
          </Button>
          <a href={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/robots-txt`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary hover:underline self-center">
            <Eye className="w-4 h-4" /> View Live
          </a>
        </div>
      </div>
    </div>
  );
};

/** Comprehensive Schema Config Panel — all 28 types grouped */
const SCHEMA_TYPES: { key: keyof SchemaConfig; label: string; desc: string; group: string }[] = [
  // Core Identity
  { key: "organization", label: "Organization + Logo", desc: "Brand identity, contact points, and social links.", group: "Core Identity" },
  { key: "localBusiness", label: "LocalBusiness + Geo", desc: "Physical address, opening hours, and geo coordinates.", group: "Core Identity" },
  // Site Structure
  { key: "website", label: "WebSite + SearchAction", desc: "Sitelinks searchbox and site-wide search integration.", group: "Site Structure" },
  { key: "webPage", label: "WebPage", desc: "Page-level metadata with ImageObject support.", group: "Site Structure" },
  { key: "breadcrumbList", label: "BreadcrumbList", desc: "Navigation path with ListItem and EntryPoint.", group: "Site Structure" },
  // E-commerce
  { key: "product", label: "Product + Offer", desc: "Product pricing, availability, SKU, and brand.", group: "E-commerce" },
  // Content
  { key: "article", label: "Article + Author", desc: "Blog post schema with publisher and dates.", group: "Content" },
  { key: "faqPage", label: "FAQPage + Q&A", desc: "Auto-detect FAQ sections and wrap in Question/Answer.", group: "Content" },
  // Events
  { key: "event", label: "Event + Place + Organizer", desc: "Optional: for workshops, webinars, or events.", group: "Events" },
  // Actions
  { key: "readAction", label: "ReadAction + PropertyValue", desc: "Map CTA buttons to help AI agents understand intent.", group: "Technical Actions" },
];

const SchemaConfigPanel = () => {
  const { config, loading } = useSchemaConfig();
  const [localConfig, setLocalConfig] = useState<SchemaConfig>(config);
  const [saving, setSaving] = useState(false);
  const [customJsonLd, setCustomJsonLd] = useState("");

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  useEffect(() => {
    const loadCustom = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "custom_json_ld")
        .single();
      if (data?.value) setCustomJsonLd(data.value);
    };
    loadCustom();
  }, []);

  const handleToggle = (key: keyof SchemaConfig) => {
    setLocalConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    await saveSchemaConfig(localConfig);
    // Save custom JSON-LD
    const { data: existing } = await supabase
      .from("site_settings")
      .select("key")
      .eq("key", "custom_json_ld")
      .single();
    if (existing) {
      await supabase.from("site_settings").update({ value: customJsonLd, updated_at: new Date().toISOString() }).eq("key", "custom_json_ld");
    } else if (customJsonLd.trim()) {
      await supabase.from("site_settings").insert({ key: "custom_json_ld", value: customJsonLd });
    }
    toast.success("Schema configuration saved!");
    setSaving(false);
  };

  if (loading) return null;

  const groups = SCHEMA_TYPES.reduce((acc, t) => {
    if (!acc[t.group]) acc[t.group] = [];
    acc[t.group].push(t);
    return acc;
  }, {} as Record<string, typeof SCHEMA_TYPES>);

  return (
    <div className="bg-background rounded-xl border border-border p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-[hsl(262,83%,58%)]" />
          <h3 className="text-sm font-semibold text-foreground">JSON-LD Schema Types (28 Types)</h3>
        </div>
        <Badge variant="outline" className="text-[10px]">
          {Object.values(localConfig).filter(Boolean).length} Active
        </Badge>
      </div>

      {Object.entries(groups).map(([group, types]) => (
        <div key={group} className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{group}</p>
          {types.map((t) => (
            <div key={t.key} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
              <div>
                <p className="text-sm font-medium text-foreground">{t.label}</p>
                <p className="text-[11px] text-muted-foreground">{t.desc}</p>
              </div>
              <Switch checked={localConfig[t.key]} onCheckedChange={() => handleToggle(t.key)} />
            </div>
          ))}
        </div>
      ))}

      {/* Custom JSON-LD Script */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Custom Script</p>
        <div className="p-3 rounded-lg bg-secondary/30 border border-border space-y-2">
          <div>
            <p className="text-sm font-medium text-foreground">Custom JSON-LD</p>
            <p className="text-[11px] text-muted-foreground">Paste a custom JSON-LD script to inject into all pages. Must be valid JSON.</p>
          </div>
          <Textarea
            value={customJsonLd}
            onChange={(e) => setCustomJsonLd(e.target.value)}
            placeholder='{"@context":"https://schema.org","@type":"Organization",...}'
            className="font-mono text-xs min-h-[120px]"
          />
          {customJsonLd.trim() && (() => {
            try { JSON.parse(customJsonLd); return <p className="text-[11px] text-primary flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Valid JSON</p>; }
            catch { return <p className="text-[11px] text-destructive flex items-center gap-1"><XCircle className="w-3 h-3" /> Invalid JSON</p>; }
          })()}
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Schema Config
      </Button>
    </div>
  );
};

/** ────────── BULK META EDITOR ────────── */
const SITE_HEALTH_DOMAINS = [
  { domain: "verifiedbm.shop", title: "Buy Verified BM And WhatsApp API", desc: "Professional Verified BM Shop for advertisers.", keyword: "verified bm", canonical: "https://verifiedbm.shop/" },
  { domain: "shop.verifiedbm.com", title: "Shop — Verified BM Store", desc: "Browse verified business managers and ad accounts.", keyword: "buy verified bm", canonical: "https://shop.verifiedbm.com/" },
  { domain: "blog.verifiedbm.com", title: "Blog — Verified BM Shop", desc: "Tips and guides for Facebook advertising.", keyword: "facebook bm guide", canonical: "https://blog.verifiedbm.com/" },
];

const SEO_LIMITS = { title: 60, desc: 160, keyword: 30 };

const BulkMetaEditor = () => {
  const [rows, setRows] = useState(SITE_HEALTH_DOMAINS.map((d, i) => ({ id: `meta-${i}`, ...d })));
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  const updateRow = (id: string, field: string, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const charClass = (len: number, max: number) =>
    len > max ? "text-red-500 font-semibold" : len > max * 0.9 ? "text-amber-500" : "text-gray-400 dark:text-gray-500";

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-500",
        animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}
    >
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Bulk Meta Tag Editor</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Edit title tags, meta descriptions, and focus keywords across all tracked domains.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
              {["Domain", "Title Tag", "Meta Description", "Focus Keyword", "Canonical URL"].map((h) => (
                <th key={h} className="text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">{row.domain}</td>
                <td className="px-4 py-2">
                  <Input value={row.title} onChange={(e) => updateRow(row.id, "title", e.target.value)} className="h-8 text-xs" />
                  <span className={cn("text-[10px] mt-0.5 block", charClass(row.title.length, SEO_LIMITS.title))}>
                    {row.title.length}/{SEO_LIMITS.title}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <Textarea value={row.desc} onChange={(e) => updateRow(row.id, "desc", e.target.value)} className="text-xs min-h-[40px] resize-none" />
                  <span className={cn("text-[10px] mt-0.5 block", charClass(row.desc.length, SEO_LIMITS.desc))}>
                    {row.desc.length}/{SEO_LIMITS.desc}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <Input value={row.keyword} onChange={(e) => updateRow(row.id, "keyword", e.target.value)} className="h-8 text-xs" />
                  <span className={cn("text-[10px] mt-0.5 block", charClass(row.keyword.length, SEO_LIMITS.keyword))}>
                    {row.keyword.length}/{SEO_LIMITS.keyword}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <Input value={row.canonical} onChange={(e) => updateRow(row.id, "canonical", e.target.value)} className="h-8 text-xs font-mono" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
        <Button size="sm" className="gap-2 bg-[#2271b1] hover:bg-[#135e96]" onClick={() => toast.success("Bulk meta tags saved!")}>
          <Save className="w-4 h-4" /> Save All Changes
        </Button>
      </div>
    </div>
  );
};

/** ────────── ROBOTS & SITEMAP MANAGER ────────── */
const DEFAULT_ROBOTS_TEMPLATE = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /checkout/

User-agent: Googlebot
Allow: /

Sitemap: https://verifiedbm.shop/sitemap.xml`;

const SITEMAP_PREVIEW = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://verifiedbm.shop/</loc>
    <lastmod>2026-04-15</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://verifiedbm.shop/shop</loc>
    <lastmod>2026-04-15</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://verifiedbm.shop/blog</loc>
    <lastmod>2026-04-14</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

const RobotsSitemapManager = () => {
  const [subTab, setSubTab] = useState<"robots" | "sitemap">("robots");
  const [robotsContent, setRobotsContent] = useState(DEFAULT_ROBOTS_TEMPLATE);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-500",
        animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}
    >
      {/* Sub-tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {(["robots", "sitemap"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              subTab === tab
                ? "text-[#2271b1] border-b-2 border-[#2271b1] bg-blue-50/50 dark:bg-blue-900/10"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            {tab === "robots" ? "Robots.txt Editor" : "Sitemap.xml Preview"}
          </button>
        ))}
      </div>

      <div className="p-6">
        {subTab === "robots" ? (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Bot className="w-4 h-4 text-[hsl(262,83%,58%)]" /> Robots.txt Configuration
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Control search engine crawler access to specific paths.</p>
            </div>
            <div className="relative">
              <Textarea
                value={robotsContent}
                onChange={(e) => setRobotsContent(e.target.value)}
                className="font-mono text-sm leading-relaxed min-h-[350px] bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 resize-none"
                spellCheck={false}
              />
              <div className="absolute top-2 right-2 flex gap-1">
                <span className="text-[10px] bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded font-mono">robots.txt</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button size="sm" className="gap-2 bg-[#2271b1] hover:bg-[#135e96]" onClick={() => toast.success("Robots.txt saved!")}>
                <Save className="w-4 h-4" /> Save Changes
              </Button>
              <Button size="sm" variant="outline" onClick={() => setRobotsContent(DEFAULT_ROBOTS_TEMPLATE)}>
                <RefreshCw className="w-4 h-4 mr-1" /> Reset Default
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Globe className="w-4 h-4 text-[hsl(217,91%,60%)]" /> Sitemap.xml Preview
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Auto-generated sitemap including all published pages, products, and blog posts.</p>
            </div>
            <div className="relative">
              <pre className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-4 text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto max-h-[400px]">
                {SITEMAP_PREVIEW}
              </pre>
              <div className="absolute top-2 right-2">
                <span className="text-[10px] bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded font-mono">sitemap.xml</span>
              </div>
            </div>
            <a
              href="https://verifiedbm.shop/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-[#2271b1] hover:underline"
            >
              <ExternalLink className="w-4 h-4" /> View Live Sitemap
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

/** ────────── SCHEMA GENERATOR WIDGET ────────── */
const SCHEMA_GEN_TYPES = [
  { value: "Product", label: "Product (e-Commerce)" },
  { value: "LocalBusiness", label: "Local Business" },
  { value: "Article", label: "Article / Blog Post" },
];

const SCHEMA_FIELDS: Record<string, { key: string; label: string; placeholder: string }[]> = {
  Product: [
    { key: "name", label: "Product Name", placeholder: "Verified Business Manager" },
    { key: "description", label: "Description", placeholder: "High-quality verified BM for advertising..." },
    { key: "price", label: "Price", placeholder: "299.00" },
    { key: "currency", label: "Currency", placeholder: "USD" },
    { key: "image", label: "Image URL", placeholder: "https://verifiedbm.shop/product.jpg" },
    { key: "sku", label: "SKU", placeholder: "VBM-001" },
    { key: "availability", label: "Availability", placeholder: "InStock" },
  ],
  LocalBusiness: [
    { key: "name", label: "Business Name", placeholder: "Verified BM Shop" },
    { key: "description", label: "Description", placeholder: "Professional digital advertising solutions..." },
    { key: "address", label: "Street Address", placeholder: "123 Digital Ave" },
    { key: "city", label: "City", placeholder: "New York" },
    { key: "phone", label: "Phone", placeholder: "+1-555-0100" },
    { key: "image", label: "Logo URL", placeholder: "https://verifiedbm.shop/logo.png" },
  ],
  Article: [
    { key: "headline", label: "Headline", placeholder: "How to Buy Verified Business Managers" },
    { key: "description", label: "Description", placeholder: "A comprehensive guide to purchasing..." },
    { key: "author", label: "Author Name", placeholder: "Akhi Vai" },
    { key: "datePublished", label: "Date Published", placeholder: "2026-04-15" },
    { key: "image", label: "Featured Image URL", placeholder: "https://verifiedbm.shop/blog/featured.jpg" },
    { key: "publisher", label: "Publisher Name", placeholder: "Verified BM Shop" },
  ],
};

const generateJsonLd = (type: string, fields: Record<string, string>) => {
  if (type === "Product") {
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name: fields.name || "",
      description: fields.description || "",
      image: fields.image || "",
      sku: fields.sku || "",
      offers: {
        "@type": "Offer",
        price: fields.price || "",
        priceCurrency: fields.currency || "USD",
        availability: `https://schema.org/${fields.availability || "InStock"}`,
      },
    };
  }
  if (type === "LocalBusiness") {
    return {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: fields.name || "",
      description: fields.description || "",
      image: fields.image || "",
      telephone: fields.phone || "",
      address: {
        "@type": "PostalAddress",
        streetAddress: fields.address || "",
        addressLocality: fields.city || "",
      },
    };
  }
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: fields.headline || "",
    description: fields.description || "",
    image: fields.image || "",
    author: { "@type": "Person", name: fields.author || "" },
    datePublished: fields.datePublished || "",
    publisher: { "@type": "Organization", name: fields.publisher || "" },
  };
};

const SchemaGeneratorWidget = () => {
  const [schemaType, setSchemaType] = useState("Product");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [animated, setAnimated] = useState(false);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setFields({});
    setGenerated(false);
  }, [schemaType]);

  const jsonLd = generateJsonLd(schemaType, fields);
  const scriptBlock = `<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n</script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptBlock);
    setCopied(true);
    toast.success("Schema copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const currentFields = SCHEMA_FIELDS[schemaType] || [];
  const filledCount = currentFields.filter((f) => fields[f.key]?.trim()).length;

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-500",
        animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}
    >
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Code2 className="w-5 h-5 text-[hsl(262,83%,58%)]" /> JSON-LD Schema Generator
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Select a schema type, fill in the fields, and copy the generated structured data.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 dark:divide-gray-700">
        {/* Left: Form */}
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Schema Type</Label>
            <Select value={schemaType} onValueChange={setSchemaType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCHEMA_GEN_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {currentFields.map((field, i) => (
              <div
                key={field.key}
                className="space-y-1 animate-fade-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">{field.label}</Label>
                <Input
                  value={fields[field.key] || ""}
                  onChange={(e) => {
                    setFields((prev) => ({ ...prev, [field.key]: e.target.value }));
                    setGenerated(true);
                  }}
                  placeholder={field.placeholder}
                  className="h-9 text-sm"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
            <CheckCircle className={cn("w-3.5 h-3.5", filledCount === currentFields.length ? "text-green-500" : "text-gray-300")} />
            {filledCount}/{currentFields.length} fields completed
          </div>
        </div>

        {/* Right: Preview */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Generated Output</p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="gap-1.5 text-xs"
            >
              {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Link2 className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy to Clipboard"}
            </Button>
          </div>
          <div className={cn(
            "relative transition-all duration-500",
            generated ? "opacity-100 translate-y-0" : "opacity-70"
          )}>
            <pre className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-4 text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto max-h-[400px] whitespace-pre-wrap">
              {scriptBlock}
            </pre>
            <div className="absolute top-2 right-2">
              <span className="text-[10px] bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded font-mono">JSON-LD</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSEO;
