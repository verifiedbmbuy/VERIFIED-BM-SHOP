import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Eye, EyeOff, Plus, Edit, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { uploadLocalMedia } from "@/lib/localMedia";
import TrackingPixelsTab from "@/components/admin/TrackingPixelsTab";
import BrandingSection from "@/components/admin/BrandingSection";
import ActivityLogsTab from "@/components/admin/ActivityLogsTab";
import MaintenanceTab from "@/components/admin/MaintenanceTab";
import FooterSettingsTab from "@/components/admin/FooterSettingsTab";
import EmailSettingsSection from "@/components/admin/EmailSettingsSection";


interface FieldErrors { [key: string]: boolean; }

interface PaymentMethod {
  id: string;
  name: string;
  slug: string;
  type: string;
  is_active: boolean;
  icon: string | null;
  description: string | null;
  instructions: string | null;
  custom_note: string | null;
  config: any;
  sort_order: number;
}

const emptyMethod = (): Partial<PaymentMethod> => ({
  name: "", slug: "", type: "manual", is_active: false, icon: "",
  description: "", instructions: "", custom_note: "", config: {}, sort_order: 0,
});

const AdminSettings = () => {
  // General
  const [siteTitle, setSiteTitle] = useState("Verified BM Shop");
  const [siteDescription, setSiteDescription] = useState("Your trusted source for verified Facebook Business Managers");
  const [contactEmail, setContactEmail] = useState("info@verifiedbm.shop");
  const [whatsapp, setWhatsapp] = useState("+1 234 567 890");
  const [homepageProductCount, setHomepageProductCount] = useState("6");

  // Profile
  const [displayName, setDisplayName] = useState("Admin");
  const [profileEmail, setProfileEmail] = useState("admin@verifiedbm.shop");
  const [bio, setBio] = useState("");

  // Security
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Payment settings
  const [cryptomusApiKey, setCryptomusApiKey] = useState("");
  const [cryptomusMerchantId, setCryptomusMerchantId] = useState("");
  const [binancePayId, setBinancePayId] = useState("");
  const [binanceQrUrl, setBinanceQrUrl] = useState("");
  const [qrUploading, setQrUploading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(true);

  // Payment methods
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [methodEditorOpen, setMethodEditorOpen] = useState(false);
  const [editMethod, setEditMethod] = useState<Partial<PaymentMethod>>(emptyMethod());

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [activeTab, setActiveTab] = useState("general");

  // Load payment settings & methods & homepage product count
  useEffect(() => {
    const load = async () => {
      setPaymentLoading(true);
      const [settingsRes, methodsRes, countRes, generalRes] = await Promise.all([
        supabase.from("site_settings").select("key, value").in("key", ["cryptomus_api_key", "cryptomus_merchant_id", "binance_pay_id", "binance_qr_url"]),
        supabase.from("payment_methods").select("*").order("sort_order", { ascending: true }),
        supabase.from("site_settings").select("value").eq("key", "homepage_product_count").maybeSingle(),
        supabase.from("site_settings").select("key, value").in("key", ["site_title", "site_description", "contact_email", "whatsapp_number"]),
      ]);

      if (settingsRes.data) {
        for (const row of settingsRes.data) {
          if (row.key === "cryptomus_api_key") setCryptomusApiKey(row.value);
          if (row.key === "cryptomus_merchant_id") setCryptomusMerchantId(row.value);
          if (row.key === "binance_pay_id") setBinancePayId(row.value);
          if (row.key === "binance_qr_url") setBinanceQrUrl(row.value);
        }
      }
      if (methodsRes.data) setPaymentMethods(methodsRes.data as PaymentMethod[]);
      if (countRes.data?.value) setHomepageProductCount(countRes.data.value);
      if (generalRes.data) {
        for (const row of generalRes.data) {
          if (row.key === "site_title" && row.value) setSiteTitle(row.value);
          if (row.key === "site_description" && row.value) setSiteDescription(row.value);
          if (row.key === "contact_email" && row.value) setContactEmail(row.value);
          if (row.key === "whatsapp_number" && row.value) setWhatsapp(row.value);
        }
      }
      setPaymentLoading(false);
    };
    load();
  }, []);

  const fetchMethods = async () => {
    const { data } = await supabase.from("payment_methods").select("*").order("sort_order", { ascending: true });
    if (data) setPaymentMethods(data as PaymentMethod[]);
  };

  const validateGeneral = () => {
    const e: FieldErrors = {};
    if (!siteTitle.trim()) e.siteTitle = true;
    if (!contactEmail.trim()) e.contactEmail = true;
    return e;
  };

  const validateProfile = () => {
    const e: FieldErrors = {};
    if (!displayName.trim()) e.displayName = true;
    if (!profileEmail.trim()) e.profileEmail = true;
    return e;
  };

  const validateSecurity = () => {
    const e: FieldErrors = {};
    if (!currentPassword.trim()) e.currentPassword = true;
    if (!newPassword.trim()) e.newPassword = true;
    if (!confirmPassword.trim()) e.confirmPassword = true;
    if (newPassword && confirmPassword && newPassword !== confirmPassword) e.confirmPassword = true;
    return e;
  };

  const handleSave = async (tab: string) => {
    let fieldErrors: FieldErrors = {};
    if (tab === "general") fieldErrors = validateGeneral();
    else if (tab === "profile") fieldErrors = validateProfile();
    else if (tab === "security") fieldErrors = validateSecurity();
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) { toast.error("Please fill in all required fields."); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    toast.success("Settings saved successfully.");
  };

  const handleSaveGeneral = async () => {
    const fieldErrors = validateGeneral();
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) { toast.error("Please fill in all required fields."); return; }
    setSaving(true);
    try {
      const settings = [
        { key: "site_title", value: siteTitle.trim() },
        { key: "site_description", value: siteDescription.trim() },
        { key: "contact_email", value: contactEmail.trim() },
        { key: "whatsapp_number", value: whatsapp.trim() },
        { key: "homepage_product_count", value: homepageProductCount },
      ].filter((s) => s.value);

      for (const setting of settings) {
        const { data: existing } = await supabase.from("site_settings").select("key").eq("key", setting.key).maybeSingle();
        if (existing) {
          await supabase.from("site_settings").update({ value: setting.value, updated_at: new Date().toISOString() }).eq("key", setting.key);
        } else {
          await supabase.from("site_settings").insert(setting);
        }
      }
      toast.success("Settings saved successfully.");
    } catch { toast.error("Failed to save settings."); }
    finally { setSaving(false); }
  };

  const savePaymentSettings = async () => {
    setSaving(true);
    try {
      const settings = [
        { key: "cryptomus_api_key", value: cryptomusApiKey.trim() },
        { key: "cryptomus_merchant_id", value: cryptomusMerchantId.trim() },
        { key: "binance_pay_id", value: binancePayId.trim() },
        { key: "binance_qr_url", value: binanceQrUrl.trim() },
      ].filter((s) => s.value);

      for (const setting of settings) {
        const { data: existing } = await supabase.from("site_settings").select("key").eq("key", setting.key).maybeSingle();
        if (existing) {
          await supabase.from("site_settings").update({ value: setting.value, updated_at: new Date().toISOString() }).eq("key", setting.key);
        } else {
          await supabase.from("site_settings").insert(setting);
        }
      }
      toast.success("Payment settings saved!");
    } catch { toast.error("Failed to save payment settings."); }
    finally { setSaving(false); }
  };

  const toggleMethod = async (method: PaymentMethod) => {
    const { error } = await supabase.from("payment_methods").update({ is_active: !method.is_active }).eq("id", method.id);
    if (error) toast.error("Failed to update.");
    else { toast.success(`${method.name} ${!method.is_active ? "enabled" : "disabled"}.`); fetchMethods(); }
  };

  const openMethodEditor = (m?: PaymentMethod) => {
    setEditMethod(m ? { ...m } : emptyMethod());
    setMethodEditorOpen(true);
  };

  const saveMethod = async () => {
    if (!editMethod.name?.trim() || !editMethod.slug?.trim()) {
      toast.error("Name and slug are required.");
      return;
    }
    setSaving(true);
    const payload = {
      name: editMethod.name!,
      slug: editMethod.slug!,
      type: editMethod.type || "manual",
      is_active: editMethod.is_active || false,
      icon: editMethod.icon || null,
      description: editMethod.description || null,
      instructions: editMethod.instructions || null,
      custom_note: editMethod.custom_note || null,
      sort_order: editMethod.sort_order || 0,
    };

    if (editMethod.id) {
      const { error } = await supabase.from("payment_methods").update(payload).eq("id", editMethod.id);
      if (error) toast.error("Failed to update."); else toast.success("Payment method updated.");
    } else {
      const { error } = await supabase.from("payment_methods").insert(payload);
      if (error) toast.error(error.message?.includes("duplicate") ? "Slug must be unique." : "Failed to create.");
      else toast.success("Payment method created.");
    }
    setSaving(false);
    setMethodEditorOpen(false);
    fetchMethods();
  };

  const deleteMethod = async (id: string) => {
    const { error } = await supabase.from("payment_methods").delete().eq("id", id);
    if (error) toast.error("Failed to delete."); else { toast.success("Deleted."); fetchMethods(); }
  };

  const inputClass = (field: string) =>
    cn(errors[field] && "border-destructive ring-destructive focus-visible:ring-destructive");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Settings</h2>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setErrors({}); }}>
        <TabsList className="bg-secondary/50 flex-wrap">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="tracking">Tracking & Pixels</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance & Backup</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>




        {/* General */}
        <TabsContent value="general">
          <div className="bg-background rounded-xl border border-border p-6 space-y-5 mt-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Site Title <span className="text-destructive">*</span></label>
              <Input value={siteTitle} onChange={(e) => { setSiteTitle(e.target.value); setErrors((p) => ({ ...p, siteTitle: false })); }} className={inputClass("siteTitle")} />
              {errors.siteTitle && <p className="text-xs text-destructive mt-1">Site title is required.</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Site Description</label>
              <Textarea value={siteDescription} onChange={(e) => setSiteDescription(e.target.value)} rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Contact Email <span className="text-destructive">*</span></label>
              <Input value={contactEmail} onChange={(e) => { setContactEmail(e.target.value); setErrors((p) => ({ ...p, contactEmail: false })); }} className={inputClass("contactEmail")} />
              {errors.contactEmail && <p className="text-xs text-destructive mt-1">Contact email is required.</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">WhatsApp Number</label>
              <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
            </div>

            <div className="border-t border-border pt-5">
              <h3 className="text-base font-semibold text-foreground mb-1">Home Page Layout</h3>
              <p className="text-xs text-muted-foreground mb-4">Control how many products appear on the home page grid.</p>
              <div>
                <Label className="mb-1.5 block">Number of Products to Display</Label>
                <Select value={homepageProductCount} onValueChange={setHomepageProductCount}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 Products</SelectItem>
                    <SelectItem value="6">6 Products</SelectItem>
                    <SelectItem value="9">9 Products</SelectItem>
                    <SelectItem value="12">12 Products</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={() => handleSaveGeneral()} disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Changes
            </Button>

            <EmailSettingsSection />
          </div>
        </TabsContent>

        {/* Branding */}
        <TabsContent value="branding">
          <div className="bg-background rounded-xl border border-border p-6 mt-4">
            <BrandingSection />
          </div>
        </TabsContent>

        {/* Footer */}
        <TabsContent value="footer">
          <div className="bg-background rounded-xl border border-border p-6 mt-4">
            <FooterSettingsTab />
          </div>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment">
          <div className="bg-background rounded-xl border border-border p-6 space-y-6 mt-4">
            {paymentLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading…</div>
            ) : (
              <>
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-1">Cryptomus Integration</h3>
                  <p className="text-xs text-muted-foreground mb-4">Configure your Cryptomus API to accept automatic crypto payments.</p>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Merchant ID</label>
                      <Input value={cryptomusMerchantId} onChange={(e) => setCryptomusMerchantId(e.target.value)} placeholder="Enter Cryptomus Merchant ID" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">API Key</label>
                      <div className="relative">
                        <Input type={showApiKey ? "text" : "password"} value={cryptomusApiKey} onChange={(e) => setCryptomusApiKey(e.target.value)} placeholder="Enter Cryptomus API Key" className="pr-10" />
                        <button type="button" onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <h3 className="text-base font-semibold text-foreground mb-1">Binance Pay (Manual)</h3>
                  <p className="text-xs text-muted-foreground mb-4">Your Binance Pay ID and QR code shown to customers for manual transfers.</p>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Binance Pay ID</label>
                      <Input value={binancePayId} onChange={(e) => setBinancePayId(e.target.value)} placeholder="e.g. 895693102" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Binance QR Code Image</label>
                      <p className="text-xs text-muted-foreground mb-2">Upload your Binance Pay QR code screenshot. This will be shown on the checkout page.</p>
                      {binanceQrUrl ? (
                        <div className="flex items-start gap-4">
                          <div className="border border-border rounded-lg p-2 bg-white">
                            <img src={binanceQrUrl} alt="Binance QR Code" className="w-32 h-32 object-contain" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground break-all max-w-xs">{binanceQrUrl}</p>
                            <Button variant="outline" size="sm" onClick={() => setBinanceQrUrl("")} className="gap-1">
                              <X className="w-3.5 h-3.5" /> Remove
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-primary/50 transition-colors">
                          {qrUploading ? (
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                          ) : (
                            <>
                              <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                              <span className="text-sm text-muted-foreground">Click to upload QR code image</span>
                              <span className="text-xs text-muted-foreground mt-1">JPG or PNG, max 5MB</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png"
                            className="hidden"
                            disabled={qrUploading}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 5 * 1024 * 1024) { toast.error("File must be under 5MB."); return; }
                              setQrUploading(true);
                              try {
                                const uploaded = await uploadLocalMedia({
                                  file,
                                  pathPrefix: "payments",
                                  slug: `binance-qr-${Date.now()}-${file.name}`,
                                  fileName: "binance qr",
                                  altText: "binance qr code",
                                });
                                setBinanceQrUrl(uploaded.url);
                                toast.success("QR code uploaded! Click 'Save Payment Settings' to apply.");
                              } catch {
                                toast.error("Failed to upload QR code.");
                              } finally {
                                setQrUploading(false);
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <Button onClick={savePaymentSettings} disabled={saving} className="gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Payment Settings
                </Button>
              </>
            )}
          </div>
        </TabsContent>

        {/* Payment Methods Management */}
        <TabsContent value="methods">
          <div className="bg-background rounded-xl border border-border p-6 space-y-6 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">Payment Methods</h3>
                <p className="text-xs text-muted-foreground mt-1">Manage which payment methods appear on the checkout page.</p>
              </div>
              <Button onClick={() => openMethodEditor()} size="sm" className="gap-2">
                <Plus className="w-4 h-4" /> Add Method
              </Button>
            </div>

            {paymentLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading…</div>
            ) : (
              <div className="space-y-3">
                {paymentMethods.map((pm) => (
                  <div key={pm.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/20">
                    <div className="flex items-center gap-4">
                      <Switch checked={pm.is_active} onCheckedChange={() => toggleMethod(pm)} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{pm.icon}</span>
                          <span className="font-medium text-foreground">{pm.name}</span>
                          <Badge variant="outline" className="text-xs capitalize">{pm.type}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{pm.description}</p>
                        {pm.custom_note && <p className="text-xs text-primary mt-0.5">{pm.custom_note}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openMethodEditor(pm)} className="p-2 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteMethod(pm.id)} className="p-2 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {paymentMethods.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">No payment methods configured.</p>
                )}
              </div>
            )}
          </div>

          {/* Method Editor Dialog */}
          <Dialog open={methodEditorOpen} onOpenChange={setMethodEditorOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editMethod.id ? "Edit Payment Method" : "Add Payment Method"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name *</Label>
                    <Input value={editMethod.name || ""} onChange={(e) => setEditMethod({ ...editMethod, name: e.target.value })} placeholder="e.g. PayPal" className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Slug *</Label>
                    <Input value={editMethod.slug || ""} onChange={(e) => setEditMethod({ ...editMethod, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} placeholder="e.g. paypal" className="mt-1.5 font-mono" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select value={editMethod.type || "manual"} onValueChange={(v) => setEditMethod({ ...editMethod, type: v })}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual (Proof Upload)</SelectItem>
                        <SelectItem value="api">API (Automatic)</SelectItem>
                        <SelectItem value="placeholder">Placeholder (Coming Soon)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Icon (Emoji)</Label>
                    <Input value={editMethod.icon || ""} onChange={(e) => setEditMethod({ ...editMethod, icon: e.target.value })} placeholder="e.g. 💳" className="mt-1.5" />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Input value={editMethod.description || ""} onChange={(e) => setEditMethod({ ...editMethod, description: e.target.value })} placeholder="Short description for customers" className="mt-1.5" />
                </div>
                <div>
                  <Label>Instructions (HTML)</Label>
                  <Textarea value={editMethod.instructions || ""} onChange={(e) => setEditMethod({ ...editMethod, instructions: e.target.value })} placeholder="Payment instructions shown during checkout…" rows={4} className="mt-1.5" />
                </div>
                <div>
                  <Label>Custom Note</Label>
                  <Input value={editMethod.custom_note || ""} onChange={(e) => setEditMethod({ ...editMethod, custom_note: e.target.value })} placeholder="e.g. 'Discount for Crypto users!'" className="mt-1.5" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Sort Order</Label>
                    <Input type="number" value={editMethod.sort_order || 0} onChange={(e) => setEditMethod({ ...editMethod, sort_order: Number(e.target.value) })} className="mt-1.5" />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <Switch checked={editMethod.is_active || false} onCheckedChange={(v) => setEditMethod({ ...editMethod, is_active: v })} />
                    <Label>Active</Label>
                  </div>
                </div>
                <Button onClick={saveMethod} disabled={saving} className="w-full gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editMethod.id ? "Update Method" : "Create Method"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Tracking & Pixels */}
        <TabsContent value="tracking">
          <TrackingPixelsTab />
        </TabsContent>

        {/* Maintenance & Backup */}
        <TabsContent value="maintenance">
          <MaintenanceTab />
        </TabsContent>

        {/* Activity Logs */}
        <TabsContent value="logs">
          <ActivityLogsTab />
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <div className="bg-background rounded-xl border border-border p-6 space-y-5 mt-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Current Password <span className="text-destructive">*</span></label>
              <Input type="password" value={currentPassword} onChange={(e) => { setCurrentPassword(e.target.value); setErrors((p) => ({ ...p, currentPassword: false })); }} className={inputClass("currentPassword")} placeholder="Enter current password" />
              {errors.currentPassword && <p className="text-xs text-destructive mt-1">Current password is required.</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">New Password <span className="text-destructive">*</span></label>
              <Input type="password" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setErrors((p) => ({ ...p, newPassword: false })); }} className={inputClass("newPassword")} placeholder="Enter new password" />
              {errors.newPassword && <p className="text-xs text-destructive mt-1">New password is required.</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Confirm Password <span className="text-destructive">*</span></label>
              <Input type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => ({ ...p, confirmPassword: false })); }} className={inputClass("confirmPassword")} placeholder="Confirm new password" />
              {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{newPassword !== confirmPassword ? "Passwords do not match." : "Confirm password is required."}</p>}
            </div>
            <Button onClick={() => handleSave("security")} disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Update Password
            </Button>
          </div>
        </TabsContent>

        {/* Profile */}
        <TabsContent value="profile">
          <div className="bg-background rounded-xl border border-border p-6 space-y-5 mt-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Display Name <span className="text-destructive">*</span></label>
              <Input value={displayName} onChange={(e) => { setDisplayName(e.target.value); setErrors((p) => ({ ...p, displayName: false })); }} className={inputClass("displayName")} />
              {errors.displayName && <p className="text-xs text-destructive mt-1">Display name is required.</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email <span className="text-destructive">*</span></label>
              <Input value={profileEmail} onChange={(e) => { setProfileEmail(e.target.value); setErrors((p) => ({ ...p, profileEmail: false })); }} className={inputClass("profileEmail")} />
              {errors.profileEmail && <p className="text-xs text-destructive mt-1">Email is required.</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Bio</label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="Tell us about yourself…" />
            </div>
            <Button onClick={() => handleSave("profile")} disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Profile
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
