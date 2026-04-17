import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

const PageHeroTab = () => {
  const [heroImage, setHeroImage] = useState("");
  const [overlay, setOverlay] = useState(50);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["page_hero_image", "page_hero_overlay"]);

      if (data) {
        data.forEach((r) => {
          if (r.key === "page_hero_image") setHeroImage(r.value);
          if (r.key === "page_hero_overlay") setOverlay(parseInt(r.value || "50", 10));
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `page-hero-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
      setHeroImage(urlData.publicUrl);
      toast.success("Image uploaded! Click Save to apply.");
    } catch {
      toast.error("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settings = [
        { key: "page_hero_image", value: heroImage },
        { key: "page_hero_overlay", value: String(overlay) },
      ];

      for (const setting of settings) {
        const { data: existing } = await supabase
          .from("site_settings")
          .select("key")
          .eq("key", setting.key)
          .single();

        if (existing) {
          await supabase.from("site_settings").update({ value: setting.value, updated_at: new Date().toISOString() }).eq("key", setting.key);
        } else {
          await supabase.from("site_settings").insert(setting);
        }
      }
      toast.success("Page Hero settings saved!");
    } catch {
      toast.error("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-foreground mb-1">Page Hero Background</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Upload a background image that appears on all page heroes (Shop, Blog, FAQ, etc.) except the Home page.
          If no image is uploaded, your primary brand color is used as the background.
        </p>

        {heroImage ? (
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden border border-border" style={{ minHeight: 200 }}>
              <img src={heroImage} alt="Hero background" className="w-full h-48 object-cover" />
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ backgroundColor: `rgba(0,0,0,${overlay / 100})` }}
              >
                <span className="text-primary-foreground text-xl font-bold">Preview Title</span>
              </div>
            </div>
            <div className="flex gap-2">
              <label className="cursor-pointer">
                <Button variant="outline" size="sm" className="gap-1 pointer-events-none">
                  <Upload className="w-3.5 h-3.5" /> Replace Image
                </Button>
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
              <Button variant="outline" size="sm" className="gap-1" onClick={() => setHeroImage("")}>
                <X className="w-3.5 h-3.5" /> Remove
              </Button>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-8 cursor-pointer hover:border-primary/50 transition-colors">
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Click to upload hero background image</span>
                <span className="text-xs text-muted-foreground mt-1">JPG, PNG or WebP, max 10MB</span>
              </>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        )}
      </div>

      <div className="border-t border-border pt-6">
        <Label className="text-sm font-medium text-foreground">Dark Overlay Opacity: {overlay}%</Label>
        <p className="text-xs text-muted-foreground mb-3">
          Adjust the dark overlay to ensure the page title is readable against the background image.
        </p>
        <Slider
          value={[overlay]}
          onValueChange={(v) => setOverlay(v[0])}
          min={0}
          max={100}
          step={1}
          className="max-w-md"
        />
      </div>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Hero Settings
      </Button>
    </div>
  );
};

export default PageHeroTab;
