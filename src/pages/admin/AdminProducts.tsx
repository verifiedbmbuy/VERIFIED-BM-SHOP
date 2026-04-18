import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Search, Package, Edit, Image as ImageIcon, X, Check, PlusCircle, MinusCircle, CheckCircle, Wand2, Loader2 } from "lucide-react";
import { toBrandedUrl } from "@/lib/imageUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import MediaLibraryModal from "@/components/admin/MediaLibraryModal";
import { toast } from "sonner";
import AdvancedSEOSidebar from "@/components/admin/AdvancedSEOSidebar";
import { computeSEOScore, getScoreBadgeClasses, SEOScoreResult } from "@/lib/seoScoring";
import SEOQuickFixPopup from "@/components/admin/SEOQuickFixPopup";
import { toast as sonnerToast } from "sonner";

const DEFAULT_CATEGORIES = ["Verified BM", "WhatsApp API", "Facebook Accounts", "TikTok Ads", "Agency Accounts"];

interface ProductAttribute {
  key: string;
  value: string;
}

interface SpecGroup {
  title: string;
  items: string[];
}

interface TrustPoint {
  text: string;
}

interface ProductFAQ {
  question: string;
  answer: string;
}

interface SectionHeading {
  subtitle: string;
  title: string;
  description: string;
}

const DEFAULT_HEADINGS: Record<string, SectionHeading> = {
  features: { subtitle: "What You Get", title: "Product Features & Inclusions", description: "Everything included with your purchase — no hidden fees, no surprises." },
  specs: { subtitle: "Specifications", title: "Product Details", description: "" },
  description: { subtitle: "Description", title: "About This Product", description: "" },
  payment: { subtitle: "Payment", title: "How to Make Payment", description: "We accept cryptocurrency payments for secure, fast, and worldwide transactions." },
  delivery: { subtitle: "Delivery", title: "How We Deliver Your Account", description: "A fully transparent, secure process from purchase to access." },
  whyUs: { subtitle: "Why Verified BM Shop", title: "Why Customers Choose Us", description: "Trusted by 1,000+ advertisers worldwide for verified Meta accounts." },
  testimonials: { subtitle: "Testimonials", title: "What Our Customers Say", description: "Real reviews from verified buyers who trust Verified BM Shop." },
  faq: { subtitle: "FAQ", title: "Frequently Asked Questions", description: "" },
};

interface Product {
  id: string;
  title: string;
  slug: string;
  sku: string | null;
  description: string | null;
  short_description: string | null;
  price: number;
  sale_price: number | null;
  category: string;
  badge: string | null;
  image_url: string | null;
  gallery_images: string[];
  rating: number | null;
  sort_order: number | null;
  is_featured: boolean | null;
  stock_quantity: number;
  stock_status: string;
  meta_title: string | null;
  meta_description: string | null;
  focus_keyword: string | null;
  created_at: string;
  attributes?: Record<string, string> | null;
}

const generateSlug = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

const emptyProduct = (): Partial<Product> => ({
  title: "", slug: "", sku: "", description: "", short_description: "", price: 0,
  sale_price: null, category: "Verified BM", badge: null, image_url: "",
  gallery_images: [], rating: 5, sort_order: 0, is_featured: false,
  stock_quantity: 0, stock_status: "in_stock", meta_title: "", meta_description: "", focus_keyword: "",
});

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Partial<Product>>(emptyProduct());
  const [saving, setSaving] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<"main" | "gallery">("main");
  const [skuError, setSkuError] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [specGroups, setSpecGroups] = useState<SpecGroup[]>([]);
  const [trustPoints, setTrustPoints] = useState<TrustPoint[]>([]);
  const [productFaqs, setProductFaqs] = useState<ProductFAQ[]>([]);
  const [sectionHeadings, setSectionHeadings] = useState<Record<string, SectionHeading>>({});
  const [globalFaqs, setGlobalFaqs] = useState<{ id: string; question: string; answer: string; faq_group: string }[]>([]);

  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [newCategoryInput, setNewCategoryInput] = useState("");

  // Merge default + custom + categories from existing products
  const CATEGORIES = useMemo(() => {
    const fromProducts = products.map(p => p.category).filter(Boolean);
    const all = new Set([...DEFAULT_CATEGORIES, ...customCategories, ...fromProducts]);
    return Array.from(all).sort();
  }, [products, customCategories]);

  const addCustomCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    if (CATEGORIES.includes(trimmed)) { toast.info("Category already exists."); return; }
    setCustomCategories(prev => [...prev, trimmed]);
    setNewCategoryInput("");
    toast.success(`Category "${trimmed}" added.`);
  };

  // SEO scoring
  const [seoPopup, setSeoPopup] = useState<{ product: Product; result: SEOScoreResult } | null>(null);
  const [bulkScanning, setBulkScanning] = useState(false);

  const seoScores = useMemo(() => {
    const map = new Map<string, SEOScoreResult>();
    products.forEach((p) => {
      map.set(p.id, computeSEOScore({
        title: p.title,
        slug: p.slug,
        metaTitle: p.meta_title,
        metaDescription: p.meta_description,
        focusKeyword: p.focus_keyword,
        content: p.description,
        urlPrefix: "/product/",
      }));
    });
    return map;
  }, [products]);

  const bulkAIScan = async () => {
    setBulkScanning(true);
    let fixCount = 0;
    for (const p of products) {
      const result = seoScores.get(p.id);
      if (!result || result.score >= 80 || !p.focus_keyword) continue;
      try {
        const updates: Record<string, any> = {};
        if (result.issues.some((i) => i.includes("description"))) {
          const { data } = await supabase.functions.invoke("seo-ai-fix", {
            body: { action: "fix_meta_description", context: { focusKeyword: p.focus_keyword, productTitle: p.title, currentTitle: p.meta_title } },
          });
          if (data?.metaDescription) updates.meta_description = data.metaDescription;
        }
        if (result.issues.some((i) => i.includes("title"))) {
          const { data } = await supabase.functions.invoke("seo-ai-fix", {
            body: { action: "fix_meta_title", context: { focusKeyword: p.focus_keyword, productTitle: p.title } },
          });
          if (data?.metaTitle) updates.meta_title = data.metaTitle;
        }
        if (Object.keys(updates).length > 0) {
          await supabase.from("products").update(updates).eq("id", p.id);
          fixCount++;
        }
      } catch { /* skip failures */ }
    }
    sonnerToast.success(`AI scan complete. Fixed ${fixCount} product(s).`);
    setBulkScanning(false);
    fetchProducts();
  };

  // Inline editing
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlinePrice, setInlinePrice] = useState("");
  const [inlineStock, setInlineStock] = useState("");

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("products").select("*").order("sort_order", { ascending: true });
    if (!error && data) setProducts(data as unknown as Product[]);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  useEffect(() => {
    const fetchGlobalFaqs = async () => {
      const { data } = await supabase.from("faqs").select("*").order("sort_order");
      if (data) setGlobalFaqs(data);
    };
    fetchGlobalFaqs();
  }, []);

  const openNew = () => { setEditProduct(emptyProduct()); setSkuError(""); setSlugManual(false); setAttributes([]); setSpecGroups([]); setTrustPoints([]); setProductFaqs([]); setSectionHeadings({}); setEditorOpen(true); };
  const openEdit = (p: Product) => {
    setEditProduct({
      ...p,
      image_url: p.image_url ? toBrandedUrl(p.image_url) : p.image_url,
      gallery_images: (p.gallery_images || []).map((u) => toBrandedUrl(u)),
    });
    setSkuError("");
    setSlugManual(true);
    const attrs = p.attributes || {};
    const flatAttrs = Object.entries(attrs)
      .filter(([key]) => !key.startsWith("_"))
      .map(([key, value]) => ({ key, value: String(value) }));
    setAttributes(flatAttrs);
    setSpecGroups((attrs as any)._specs || []);
    setTrustPoints(((attrs as any)._trust_points || []).map((t: string) => ({ text: t })));
    setProductFaqs((attrs as any)._faqs || []);
    setSectionHeadings((attrs as any)._headings || {});
    setEditorOpen(true);
  };

  const validateProduct = () => {
    if (!editProduct.title?.trim()) { toast.error("Title is required."); return false; }
    if (editProduct.price === undefined || editProduct.price === null || editProduct.price < 0) { toast.error("Price must be 0 or greater."); return false; }
    if (editProduct.sale_price !== null && editProduct.sale_price !== undefined && editProduct.sale_price < 0) { toast.error("Sale price cannot be negative."); return false; }
    if (editProduct.stock_quantity !== undefined && editProduct.stock_quantity < 0) { toast.error("Stock quantity cannot be negative."); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validateProduct()) return;
    setSaving(true);
    setSkuError("");

    const slug = editProduct.slug?.trim() || generateSlug(editProduct.title!);
    const hasSale = editProduct.sale_price !== null && editProduct.sale_price !== undefined && editProduct.sale_price > 0;

    const payload: any = {
      title: editProduct.title,
      slug,
      sku: editProduct.sku?.trim() || null,
      description: editProduct.description || null,
      short_description: editProduct.short_description || null,
      price: Number(editProduct.price),
      sale_price: editProduct.sale_price ? Number(editProduct.sale_price) : null,
      category: editProduct.category || "Verified BM",
      badge: hasSale ? "Sale" : (editProduct.badge === "Sale" ? null : editProduct.badge || null),
      image_url: editProduct.image_url ? toBrandedUrl(editProduct.image_url) : null,
      gallery_images: (editProduct.gallery_images || []).map((u) => toBrandedUrl(u)),
      rating: editProduct.rating ? Number(editProduct.rating) : 5,
      sort_order: editProduct.sort_order ? Number(editProduct.sort_order) : 0,
      is_featured: editProduct.is_featured || false,
      stock_quantity: Number(editProduct.stock_quantity) || 0,
      stock_status: editProduct.stock_status || "in_stock",
      meta_title: editProduct.meta_title || null,
      meta_description: editProduct.meta_description || null,
      focus_keyword: editProduct.focus_keyword || null,
      attributes: {
        ...attributes.reduce((acc, a) => { if (a.key.trim()) acc[a.key.trim()] = a.value; return acc; }, {} as Record<string, string>),
        _specs: specGroups.filter(g => g.title.trim() && g.items.some(i => i.trim())),
        _trust_points: trustPoints.map(t => t.text).filter(Boolean),
        _faqs: productFaqs.filter(f => f.question.trim() && f.answer.trim()),
        _headings: Object.keys(sectionHeadings).length > 0 ? sectionHeadings : undefined,
      },
    };

    if (editProduct.id) {
      const { error } = await supabase.from("products").update(payload).eq("id", editProduct.id);
      if (error) {
        if (error.message?.includes("duplicate") && error.message?.includes("sku")) {
          setSkuError("SKU must be unique.");
        } else {
          toast.error("Failed to update product.");
        }
        setSaving(false); return;
      }
      toast.success("Product updated.");
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) {
        if (error.message?.includes("duplicate") && error.message?.includes("sku")) {
          setSkuError("SKU must be unique.");
        } else {
          toast.error("Failed to create product.");
        }
        setSaving(false); return;
      }
      toast.success("Product created.");
    }
    setSaving(false);
    setEditorOpen(false);
    fetchProducts();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("products").delete().eq("id", deleteId);
    if (error) toast.error("Failed to delete.");
    else toast.success("Product deleted.");
    setDeleteId(null);
    fetchProducts();
  };

  const startInlineEdit = (p: Product) => {
    setInlineEditId(p.id);
    setInlinePrice(String(p.price));
    setInlineStock(String(p.stock_quantity));
  };

  const saveInlineEdit = async () => {
    if (!inlineEditId) return;
    const price = Number(inlinePrice);
    const stock = Number(inlineStock);
    if (price < 0 || stock < 0) { toast.error("Values cannot be negative."); return; }
    const { error } = await supabase.from("products").update({ price, stock_quantity: stock }).eq("id", inlineEditId);
    if (error) toast.error("Failed to update.");
    else toast.success("Updated.");
    setInlineEditId(null);
    fetchProducts();
  };

  const openMedia = (target: "main" | "gallery") => {
    setMediaTarget(target);
    setMediaOpen(true);
  };

  const removeGalleryImage = (url: string) => {
    setEditProduct({ ...editProduct, gallery_images: (editProduct.gallery_images || []).filter((u) => u !== url) });
  };

  const filtered = products
    .filter((p) => p.title.toLowerCase().includes(search.toLowerCase()) || (p.sku || "").toLowerCase().includes(search.toLowerCase()))
    .filter((p) => catFilter === "all" || p.category === catFilter)
    .filter((p) => stockFilter === "all" || p.stock_status === stockFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">Products</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={bulkAIScan} disabled={bulkScanning} className="gap-1.5">
            {bulkScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
            AI Scan All
          </Button>
          <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> New Product</Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or SKU…" className="pl-9" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Stock" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stock</SelectItem>
            <SelectItem value="in_stock">In Stock</SelectItem>
            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-background rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No products found</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first product to get started.</p>
            <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> Create Product</Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="hidden sm:table-cell">SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="hidden md:table-cell">Stock</TableHead>
                <TableHead className="hidden lg:table-cell">SEO</TableHead>
                <TableHead className="w-28"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-3">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.title} className="w-10 h-10 rounded object-cover" loading="lazy" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center text-xs text-muted-foreground">N/A</div>
                      )}
                      <div>
                        <span className="block">{p.title}</span>
                        <span className="text-xs text-muted-foreground">{p.category}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground font-mono">{p.sku || "—"}</TableCell>
                  <TableCell>
                    {inlineEditId === p.id ? (
                      <Input
                        type="number"
                        min="0"
                        value={inlinePrice}
                        onChange={(e) => setInlinePrice(e.target.value)}
                        className="w-24 h-8 text-sm"
                      />
                    ) : (
                      <span className="text-foreground">
                        {p.sale_price ? (
                          <><span className="line-through text-muted-foreground mr-1">${p.price}</span>${p.sale_price}</>
                        ) : `$${p.price}`}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {inlineEditId === p.id ? (
                      <Input
                        type="number"
                        min="0"
                        value={inlineStock}
                        onChange={(e) => setInlineStock(e.target.value)}
                        className="w-20 h-8 text-sm"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground">{p.stock_quantity}</span>
                        <Badge variant={p.stock_status === "in_stock" ? "default" : "destructive"} className="text-xs capitalize">
                          {p.stock_status === "in_stock" ? "In Stock" : "Out"}
                        </Badge>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {(() => {
                      const result = seoScores.get(p.id);
                      if (!result) return null;
                      return (
                        <button
                          onClick={() => setSeoPopup({ product: p, result })}
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold cursor-pointer transition-colors hover:opacity-80 ${getScoreBadgeClasses(result.score)}`}
                          title="Click to quick-fix SEO"
                        >
                          {result.score}
                        </button>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {inlineEditId === p.id ? (
                        <>
                          <button onClick={saveInlineEdit} className="p-1.5 rounded text-muted-foreground hover:text-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,45%)]/10 transition-colors" title="Save">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setInlineEditId(null)} className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Cancel">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startInlineEdit(p)} className="p-1.5 rounded text-muted-foreground hover:text-[hsl(45,93%,47%)] hover:bg-[hsl(45,93%,47%)]/10 transition-colors" title="Quick Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Full Edit">
                            <Package className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* SEO Quick Fix Popup */}
      {seoPopup && (
        <SEOQuickFixPopup
          itemTitle={seoPopup.product.title}
          seoResult={seoPopup.result}
          onClose={() => setSeoPopup(null)}
          onFixed={async (updates) => {
            await supabase.from("products").update(updates).eq("id", seoPopup.product.id);
            setSeoPopup(null);
            fetchProducts();
          }}
        />
      )}

      {/* Product Editor Dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>{editProduct.id ? "Edit Product" : "New Product"}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="basic" className="pt-2 flex flex-col min-h-0 flex-1">
            <TabsList className="w-full shrink-0 sticky top-0 z-10 bg-muted">
              <TabsTrigger value="basic" className="flex-1">Basic Info</TabsTrigger>
              <TabsTrigger value="pricing" className="flex-1">Pricing & Stock</TabsTrigger>
              <TabsTrigger value="attributes" className="flex-1">Attributes</TabsTrigger>
              <TabsTrigger value="images" className="flex-1">Images</TabsTrigger>
              <TabsTrigger value="seo" className="flex-1">SEO</TabsTrigger>
              <TabsTrigger value="faqs" className="flex-1">FAQs</TabsTrigger>
              <TabsTrigger value="headings" className="flex-1">Headings</TabsTrigger>
            </TabsList>

            <div className="overflow-y-auto flex-1 min-h-0">
            <TabsContent value="basic" className="space-y-4 pt-4">
              <div>
                <Label>Product Name *</Label>
                <Input value={editProduct.title || ""} onChange={(e) => { const title = e.target.value; const updates: Partial<Product> = { ...editProduct, title }; if (!editProduct.id && !slugManual) updates.slug = generateSlug(title); if (!editProduct.meta_title) updates.meta_title = `${title} - Buy Online`; setEditProduct(updates); }} placeholder="Product title" className="mt-1.5" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Slug (URL Path)</Label>
                  <Input value={editProduct.slug || ""} onChange={(e) => { setEditProduct({ ...editProduct, slug: e.target.value }); setSlugManual(true); }} placeholder="product-slug" className="mt-1.5 font-mono text-sm" />
                  <p className="text-xs text-muted-foreground mt-1">URL: verifiedbm.shop/product/<span className="font-semibold">{editProduct.slug || "..."}</span></p>
                </div>
                <div>
                  <Label>SKU (Unique ID)</Label>
                  <Input value={editProduct.sku || ""} onChange={(e) => { setEditProduct({ ...editProduct, sku: e.target.value }); setSkuError(""); }} placeholder="e.g. VBM-001" className={`mt-1.5 font-mono text-sm ${skuError ? "border-destructive" : ""}`} />
                  {skuError && <p className="text-xs text-destructive mt-1">{skuError}</p>}
                </div>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={editProduct.category || "Verified BM"} onValueChange={(v) => setEditProduct({ ...editProduct, category: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    placeholder="Add new category…"
                    className="flex-1 h-8 text-sm"
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomCategory(); } }}
                  />
                  <Button type="button" size="sm" variant="outline" onClick={addCustomCategory} className="h-8 gap-1">
                    <PlusCircle className="w-3.5 h-3.5" /> Add
                  </Button>
                </div>
              </div>
              <div>
                <Label>Short Description</Label>
                <Input value={editProduct.short_description || ""} onChange={(e) => setEditProduct({ ...editProduct, short_description: e.target.value })} placeholder="Brief product summary" className="mt-1.5" />
              </div>
              <div>
                <Label>Full Description (Rich Text)</Label>
                <Textarea value={editProduct.description || ""} onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })} placeholder="Detailed description…" rows={6} className="mt-1.5" />
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Regular Price *</Label>
                  <Input type="number" min="0" step="0.01" value={editProduct.price ?? ""} onChange={(e) => setEditProduct({ ...editProduct, price: Math.max(0, Number(e.target.value)) })} placeholder="0.00" className="mt-1.5" />
                </div>
                <div>
                  <Label>Sale Price</Label>
                  <Input type="number" min="0" step="0.01" value={editProduct.sale_price ?? ""} onChange={(e) => setEditProduct({ ...editProduct, sale_price: e.target.value ? Math.max(0, Number(e.target.value)) : null })} placeholder="Optional" className="mt-1.5" />
                  <p className="text-xs text-muted-foreground mt-1">If set, a "Sale" badge is shown automatically.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Stock Quantity</Label>
                  <Input type="number" min="0" value={editProduct.stock_quantity ?? 0} onChange={(e) => setEditProduct({ ...editProduct, stock_quantity: Math.max(0, Number(e.target.value)) })} className="mt-1.5" />
                </div>
                <div>
                  <Label>Stock Status</Label>
                  <div className="flex items-center gap-3 mt-3">
                    <Switch
                      checked={editProduct.stock_status === "in_stock"}
                      onCheckedChange={(v) => setEditProduct({ ...editProduct, stock_status: v ? "in_stock" : "out_of_stock" })}
                    />
                    <span className="text-sm text-foreground">{editProduct.stock_status === "in_stock" ? "In Stock" : "Out of Stock"}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Badge</Label>
                  <Select value={editProduct.badge || "none"} onValueChange={(v) => setEditProduct({ ...editProduct, badge: v === "none" ? null : v })}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (auto)</SelectItem>
                      <SelectItem value="Best Seller">Best Seller</SelectItem>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Rating</Label>
                  <Input type="number" step="0.1" min="0" max="5" value={editProduct.rating ?? 5} onChange={(e) => setEditProduct({ ...editProduct, rating: Number(e.target.value) })} className="mt-1.5" />
                </div>
                <div>
                  <Label>Sort Order</Label>
                  <Input type="number" value={editProduct.sort_order ?? 0} onChange={(e) => setEditProduct({ ...editProduct, sort_order: Number(e.target.value) })} className="mt-1.5" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer pt-2">
                <input type="checkbox" checked={editProduct.is_featured || false} onChange={(e) => setEditProduct({ ...editProduct, is_featured: e.target.checked })} className="rounded border-border" />
                <span className="text-foreground">Featured Product</span>
              </label>
            </TabsContent>

            <TabsContent value="attributes" className="space-y-6 pt-4">
              {/* Feature Attributes (key-value) */}
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">Feature Attributes</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Key-value pairs shown in "What You Get" grid</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setAttributes((prev) => [...prev, { key: "", value: "" }])} className="gap-1.5">
                    <PlusCircle className="w-4 h-4" /> Add
                  </Button>
                </div>
                {attributes.length === 0 ? (
                  <div className="py-4 text-center text-muted-foreground text-sm border border-dashed border-border rounded-lg mt-2">
                    No attributes yet.
                  </div>
                ) : (
                  <div className="space-y-2 mt-2">
                    {attributes.map((attr, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input value={attr.key} onChange={(e) => setAttributes((prev) => prev.map((a, j) => j === i ? { ...a, key: e.target.value } : a))} placeholder="Key (e.g. Country)" className="flex-1" />
                        <Input value={attr.value} onChange={(e) => setAttributes((prev) => prev.map((a, j) => j === i ? { ...a, value: e.target.value } : a))} placeholder="Value (e.g. USA)" className="flex-1" />
                        <button onClick={() => setAttributes((prev) => prev.filter((_, j) => j !== i))} className="p-2 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0">
                          <MinusCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <hr className="border-border" />

              {/* Specification Groups (3-column Product Details) */}
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">Specification Groups</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">3-column "Product Details" section (e.g. Account Type, Security, Delivery)</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSpecGroups((prev) => [...prev, { title: "", items: [""] }])} className="gap-1.5">
                    <PlusCircle className="w-4 h-4" /> Add Group
                  </Button>
                </div>
                {specGroups.length === 0 ? (
                  <div className="py-4 text-center text-muted-foreground text-sm border border-dashed border-border rounded-lg mt-2">
                    No spec groups. Defaults will be used.
                  </div>
                ) : (
                  <div className="space-y-4 mt-2">
                    {specGroups.map((group, gi) => (
                      <div key={gi} className="rounded-lg border border-border p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Input
                            value={group.title}
                            onChange={(e) => setSpecGroups((prev) => prev.map((g, j) => j === gi ? { ...g, title: e.target.value } : g))}
                            placeholder="Group title (e.g. Account Type)"
                            className="flex-1 font-semibold"
                          />
                          <button onClick={() => setSpecGroups((prev) => prev.filter((_, j) => j !== gi))} className="p-2 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0">
                            <MinusCircle className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="space-y-1.5 pl-2">
                          {group.items.map((item, ii) => (
                            <div key={ii} className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-[hsl(142,70%,45%)] shrink-0" />
                              <Input
                                value={item}
                                onChange={(e) => setSpecGroups((prev) => prev.map((g, j) => j === gi ? { ...g, items: g.items.map((it, k) => k === ii ? e.target.value : it) } : g))}
                                placeholder="Spec item (e.g. Verified Business Manager)"
                                className="flex-1 h-8 text-sm"
                              />
                              <button onClick={() => setSpecGroups((prev) => prev.map((g, j) => j === gi ? { ...g, items: g.items.filter((_, k) => k !== ii) } : g))} className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors shrink-0">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          <Button variant="ghost" size="sm" onClick={() => setSpecGroups((prev) => prev.map((g, j) => j === gi ? { ...g, items: [...g.items, ""] } : g))} className="text-xs gap-1 h-7 mt-1">
                            <PlusCircle className="w-3 h-3" /> Add Item
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <hr className="border-border" />

              {/* Trust Points (Delivery Info checklist) */}
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">Trust Points</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Checklist shown in the buy box (e.g. "Instant delivery — within 1-4 hours")</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setTrustPoints((prev) => [...prev, { text: "" }])} className="gap-1.5">
                    <PlusCircle className="w-4 h-4" /> Add
                  </Button>
                </div>
                {trustPoints.length === 0 ? (
                  <div className="py-4 text-center text-muted-foreground text-sm border border-dashed border-border rounded-lg mt-2">
                    No trust points. Defaults will be used.
                  </div>
                ) : (
                  <div className="space-y-2 mt-2">
                    {trustPoints.map((tp, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                        <Input
                          value={tp.text}
                          onChange={(e) => setTrustPoints((prev) => prev.map((t, j) => j === i ? { text: e.target.value } : t))}
                          placeholder="e.g. Instant delivery — usually within 1-4 hours"
                          className="flex-1"
                        />
                        <button onClick={() => setTrustPoints((prev) => prev.filter((_, j) => j !== i))} className="p-2 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0">
                          <MinusCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="images" className="space-y-4 pt-4">
              <div>
                <Label>Main Image</Label>
                <div className="flex items-center gap-3 mt-1.5">
                  {editProduct.image_url ? (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
                      <img src={editProduct.image_url} alt="Main" className="w-full h-full object-cover" />
                      <button onClick={() => setEditProduct({ ...editProduct, image_url: "" })} className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5">
                        <X className="w-3 h-3 text-destructive" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-muted-foreground/40" />
                    </div>
                  )}
                  <Button variant="outline" size="sm" onClick={() => openMedia("main")}>
                    Choose from Media Library
                  </Button>
                </div>
                <div className="mt-2">
                  <Label className="text-xs text-muted-foreground">Image URL (editable)</Label>
                  <Input
                    value={editProduct.image_url || ""}
                    onChange={(e) => setEditProduct({ ...editProduct, image_url: e.target.value })}
                    placeholder="https://verifiedbm.shop/admin/media/products/image.webp"
                    className="mt-1 font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Paste any URL or pick from Media Library above. URL is saved as /admin/media/...</p>
                </div>
              </div>
              <div>
                <Label>Gallery Images</Label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {(editProduct.gallery_images || []).map((url, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
                      <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                      <button onClick={() => removeGalleryImage(url)} className="absolute top-0.5 right-0.5 bg-background/80 rounded-full p-0.5">
                        <X className="w-3 h-3 text-destructive" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => openMedia("gallery")}
                    className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:border-primary/50 transition-colors"
                  >
                    <Plus className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
                <div className="mt-2">
                  <Label className="text-xs text-muted-foreground">Add Gallery Image URL</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="gallery-url-input"
                      placeholder="https://verifiedbm.shop/admin/media/products/gallery-image.webp"
                      className="flex-1 font-mono text-xs"
                    />
                    <Button variant="outline" size="sm" onClick={() => {
                      const input = document.getElementById("gallery-url-input") as HTMLInputElement;
                      if (input?.value?.trim()) {
                        setEditProduct({ ...editProduct, gallery_images: [...(editProduct.gallery_images || []), input.value.trim()] });
                        input.value = "";
                      }
                    }}>Add</Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4 pt-4">
              <AdvancedSEOSidebar
                data={{
                  focusKeyword: editProduct.focus_keyword || "",
                  metaTitle: editProduct.meta_title || "",
                  metaDescription: editProduct.meta_description || "",
                  slug: editProduct.slug || "",
                  content: editProduct.description || "",
                  postTitle: editProduct.title || "",
                  urlPrefix: "/product/",
                }}
                focusKeyword={editProduct.focus_keyword || ""}
                metaTitle={editProduct.meta_title || ""}
                metaDescription={editProduct.meta_description || ""}
                onFocusKeywordChange={(v) => setEditProduct({ ...editProduct, focus_keyword: v })}
                onMetaTitleChange={(v) => setEditProduct({ ...editProduct, meta_title: v })}
                onMetaDescriptionChange={(v) => setEditProduct({ ...editProduct, meta_description: v })}
                onSlugChange={(v) => { setEditProduct({ ...editProduct, slug: v }); setSlugManual(true); }}
              />
            </TabsContent>

             <TabsContent value="faqs" className="space-y-4 pt-4">
               <div className="flex items-center justify-between">
                 <div>
                   <Label className="text-base font-semibold">Product FAQs</Label>
                   <p className="text-xs text-muted-foreground mt-0.5">Add Q&A pairs shown on this product's page</p>
                 </div>
                 <Button variant="outline" size="sm" onClick={() => setProductFaqs((prev) => [...prev, { question: "", answer: "" }])} className="gap-1.5">
                   <PlusCircle className="w-4 h-4" /> Add FAQ
                 </Button>
               </div>
               {productFaqs.length === 0 ? (
                 <div className="py-6 text-center text-muted-foreground text-sm border border-dashed border-border rounded-lg">
                   No product-specific FAQs yet.
                 </div>
               ) : (
                 <div className="space-y-3">
                   {productFaqs.map((faq, i) => (
                     <div key={i} className="rounded-lg border border-border p-4 space-y-2">
                       <div className="flex items-start gap-2">
                         <div className="flex-1 space-y-2">
                           <Input
                             value={faq.question}
                             onChange={(e) => setProductFaqs((prev) => prev.map((f, j) => j === i ? { ...f, question: e.target.value } : f))}
                             placeholder="Question"
                           />
                           <Textarea
                             value={faq.answer}
                             onChange={(e) => setProductFaqs((prev) => prev.map((f, j) => j === i ? { ...f, answer: e.target.value } : f))}
                             placeholder="Answer…"
                             rows={2}
                           />
                         </div>
                         <button onClick={() => setProductFaqs((prev) => prev.filter((_, j) => j !== i))} className="p-2 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 mt-1">
                           <MinusCircle className="w-4 h-4" />
                         </button>
                       </div>
                     </div>
                   ))}
                 </div>
               )}

               {/* Global FAQs section */}
               <div className="pt-4 border-t border-border">
                 <div className="flex items-center justify-between mb-3">
                   <div>
                     <Label className="text-base font-semibold">Global FAQs</Label>
                     <p className="text-xs text-muted-foreground mt-0.5">These appear on all product pages. Click + to copy into this product's FAQs.</p>
                   </div>
                 </div>
                 <div className="space-y-2 max-h-60 overflow-y-auto">
                   {globalFaqs.map((gfaq) => {
                     const alreadyAdded = productFaqs.some((pf) => pf.question === gfaq.question);
                     return (
                       <div key={gfaq.id} className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 p-3">
                         <div className="flex-1 min-w-0">
                           <p className="text-sm font-medium text-foreground truncate">{gfaq.question}</p>
                           <p className="text-xs text-muted-foreground truncate">{gfaq.answer}</p>
                         </div>
                         <Badge variant="outline" className="shrink-0 text-[10px]">{gfaq.faq_group}</Badge>
                         {alreadyAdded ? (
                           <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                         ) : (
                           <button
                             onClick={() => setProductFaqs((prev) => [...prev, { question: gfaq.question, answer: gfaq.answer }])}
                             className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
                             title="Copy to product FAQs"
                           >
                             <PlusCircle className="w-4 h-4" />
                           </button>
                         )}
                       </div>
                     );
                   })}
                 </div>
               </div>
             </TabsContent>

             <TabsContent value="headings" className="space-y-4 pt-4">
               <div>
                 <Label className="text-base font-semibold">Section Headings</Label>
                 <p className="text-xs text-muted-foreground mt-0.5">Customize the h2 titles, subtitles, and descriptions for each section on the product page. Leave blank to use defaults.</p>
               </div>
               {Object.entries(DEFAULT_HEADINGS).map(([key, defaults]) => {
                 const current = sectionHeadings[key] || {};
                 const updateHeading = (field: keyof SectionHeading, value: string) => {
                   setSectionHeadings(prev => ({
                     ...prev,
                     [key]: { ...defaults, ...prev[key], [field]: value }
                   }));
                 };
                 return (
                   <div key={key} className="rounded-lg border border-border p-4 space-y-3">
                     <div className="flex items-center justify-between">
                       <Label className="text-sm font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1').trim()} Section</Label>
                       {(current as any).title || (current as any).subtitle || (current as any).description ? (
                         <button
                           onClick={() => setSectionHeadings(prev => { const n = { ...prev }; delete n[key]; return n; })}
                           className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                         >
                           Reset to default
                         </button>
                       ) : null}
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                       <div>
                         <Label className="text-xs text-muted-foreground">Subtitle (small text above h2)</Label>
                         <Input
                           value={(current as any).subtitle ?? ""}
                           onChange={(e) => updateHeading("subtitle", e.target.value)}
                           placeholder={defaults.subtitle}
                           className="mt-1 h-8 text-sm"
                         />
                       </div>
                       <div>
                         <Label className="text-xs text-muted-foreground">H2 Title</Label>
                         <Input
                           value={(current as any).title ?? ""}
                           onChange={(e) => updateHeading("title", e.target.value)}
                           placeholder={defaults.title}
                           className="mt-1 h-8 text-sm"
                         />
                       </div>
                     </div>
                     {defaults.description && (
                       <div>
                         <Label className="text-xs text-muted-foreground">Description</Label>
                         <Input
                           value={(current as any).description ?? ""}
                           onChange={(e) => updateHeading("description", e.target.value)}
                           placeholder={defaults.description}
                           className="mt-1 h-8 text-sm"
                         />
                       </div>
                     )}
                   </div>
                 );
               })}
             </TabsContent>
           </div>
           </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editProduct.id ? "Update Product" : "Create Product"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Media Library Modal */}
      <MediaLibraryModal
        open={mediaOpen}
        onOpenChange={setMediaOpen}
        uploadPathPrefix="products"
        onSelect={(file) => {
          if (mediaTarget === "main") {
            setEditProduct({ ...editProduct, image_url: toBrandedUrl(file.url) });
          } else {
            setEditProduct({ ...editProduct, gallery_images: [...(editProduct.gallery_images || []), toBrandedUrl(file.url)] });
          }
        }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminProducts;
