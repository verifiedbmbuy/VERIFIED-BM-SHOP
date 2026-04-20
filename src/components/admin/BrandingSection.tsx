import { useState, useEffect } from "react";
import { supabase, isLocalProtectedMode } from "@/integrations/supabase/client";
import { convertToWebP, getAdminMediaUrl, resolveLegacyBrandingAsset, toBrandedUrl } from "@/lib/imageUtils";
import { uploadLocalMedia } from "@/lib/localMedia";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X, Image as ImageIcon, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import MediaLibraryModal from "@/components/admin/MediaLibraryModal";
import type { MediaFile } from "@/components/admin/MediaLibrary";

const BRANDING_FIELDS = [
  { key: "header_logo", label: "Header Logo", desc: "Main navigation bar logo (PNG/SVG, max 2MB)", accept: ".png,.svg,.webp" },
  { key: "footer_logo", label: "Footer Logo", desc: "Footer version — often white/monochrome (PNG/SVG, max 2MB)", accept: ".png,.svg,.webp" },
  { key: "favicon", label: "Favicon", desc: "Browser tab icon (PNG/ICO, 32×32 or 64×64 recommended, max 500KB)", accept: ".png,.ico,.svg" },
  { key: "invoice_logo", label: "Invoice Logo", desc: "High-resolution version for PDF invoices (PNG, max 2MB)", accept: ".png,.jpg,.jpeg" },
  { key: "homepage_hero_logo", label: "Homepage Hero Logo", desc: "Logo displayed in the homepage hero section (PNG/SVG/WebP, max 2MB)", accept: ".png,.svg,.webp" },
];

const DEV_BRANDING_OVERRIDES_KEY = "dev_branding_overrides";
const DEV_OVERRIDE_DELETED = "__deleted__";
const MAX_LOCAL_DATA_URL_LENGTH = 350_000;

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(blob);
  });

const isDataUrl = (value: string): boolean => value.startsWith("data:");

const normalizeBrandingUrl = (value: string): string => {
  if (!value) return "";
  if (value.startsWith("data:") || value.startsWith("blob:")) return value;

  const supabaseBrandingMatch = value.match(/\/storage\/v1\/object\/public\/branding\/([^?]+)/i);
  if (supabaseBrandingMatch?.[1]) {
    return `/images/logos/${supabaseBrandingMatch[1].split("/").filter(Boolean).pop() || supabaseBrandingMatch[1]}`;
  }

  const localHostPattern = /https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i;
  if (localHostPattern.test(value)) {
    const mediaMatch = value.match(/\/admin\/media\/branding\/([^?]+)/i);
    if (mediaMatch?.[1]) {
      return `/images/logos/${mediaMatch[1].split("/").filter(Boolean).pop() || mediaMatch[1]}`;
    }

    const fileMatch = value.match(/branding\/([^?]+)/i);
    if (fileMatch?.[1]) {
      return `/images/logos/${fileMatch[1].split("/").filter(Boolean).pop() || fileMatch[1]}`;
    }
  }

  if (value.startsWith("/images/")) {
    return resolveLegacyBrandingAsset(value);
  }

  if (!value.startsWith("http")) {
    const clean = value.replace(/^\/+/, "").replace(/^branding\//, "");
    return resolveLegacyBrandingAsset(`/images/logos/${clean.split("/").filter(Boolean).pop() || clean}`);
  }

  return resolveLegacyBrandingAsset(value);
};

const BrandingSection = () => {
  const [logos, setLogos] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [mediaTargetKey, setMediaTargetKey] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", BRANDING_FIELDS.map((f) => f.key));
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((r) => { map[r.key] = normalizeBrandingUrl(r.value); });
        if (typeof window !== "undefined" && isLocalProtectedMode) {
          try {
            const raw = window.localStorage.getItem(DEV_BRANDING_OVERRIDES_KEY);
            if (raw) {
              const overrides = JSON.parse(raw) as Record<string, string>;
              Object.entries(overrides).forEach(([k, v]) => {
                if (v === DEV_OVERRIDE_DELETED) {
                  delete map[k];
                } else {
                  map[k] = normalizeBrandingUrl(v);
                }
              });
            }
          } catch {
            // ignore malformed local overrides
          }
        }
        setLogos(map);
      }
      setLoading(false);
    };
    load();
  }, []);

  const persistBrandingField = async (key: string, value: string) => {
    if (typeof window !== "undefined" && isLocalProtectedMode) {
      let overrides: Record<string, string> = {};
      try {
        const raw = window.localStorage.getItem(DEV_BRANDING_OVERRIDES_KEY);
        if (raw) overrides = JSON.parse(raw) as Record<string, string>;
      } catch {
        // reset malformed value
      }
      if (value) {
        overrides[key] = value;
      } else {
        // Keep an explicit tombstone so refresh does not revive DB value.
        overrides[key] = DEV_OVERRIDE_DELETED;
      }
      try {
        window.localStorage.setItem(DEV_BRANDING_OVERRIDES_KEY, JSON.stringify(overrides));
      } catch {
        throw new Error("Local protected branding storage is full. Use a smaller image or clear browser site data.");
      }
      return;
    }

    const { error } = await supabase.from("site_settings").upsert(
      { key, value: normalizeBrandingUrl(value), updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
    if (error) throw error;
  };

  const handleUpload = async (key: string, file: File) => {
    const maxSize = key === "favicon" ? 500 * 1024 : 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File too large. Max ${key === "favicon" ? "500KB" : "2MB"}.`);
      return;
    }

    setUploading((p) => ({ ...p, [key]: true }));
    try {
      // Convert to WebP first (skip SVG/ICO)
      let processedFile: File | Blob = file;
      if (file.type.startsWith("image/") && !file.type.includes("svg") && !file.name.endsWith(".ico")) {
        processedFile = await convertToWebP(file, 0.8);
      }

      // Compress if still large (not SVG/ICO)
      if (processedFile instanceof File && processedFile.type.startsWith("image/") && !processedFile.type.includes("svg") && !processedFile.name.endsWith(".ico") && processedFile.size > 200 * 1024) {
        processedFile = await compressImage(processedFile, key === "favicon" ? 128 : 800);
      }

      if (isLocalProtectedMode) {
        const localDataUrl = await blobToDataUrl(processedFile);
        if (localDataUrl.length > MAX_LOCAL_DATA_URL_LENGTH) {
          throw new Error("Local protected upload is too large for browser storage. Use a smaller image or select from Media Library.");
        }
        setLogos((p) => ({ ...p, [key]: localDataUrl }));
        await persistBrandingField(key, localDataUrl);
        queryClient.invalidateQueries({ queryKey: ["branding"] });
        toast.success("Logo uploaded and saved locally (protected mode).");
        return;
      }

      const uploadFile = processedFile instanceof File
        ? processedFile
        : new File([processedFile], file.name, { type: file.type || "application/octet-stream" });

      const uploaded = await uploadLocalMedia({
        file: uploadFile,
        pathPrefix: "logos",
        slug: `${key}-${Date.now()}-${file.name}`,
        fileName: key.replace(/_/g, " "),
        altText: key.replace(/_/g, " "),
      });

      // Add cache-busting param
      const publicUrl = `${normalizeBrandingUrl(uploaded.url)}?t=${Date.now()}`;
      setLogos((p) => ({ ...p, [key]: publicUrl }));
      await persistBrandingField(key, publicUrl);
      queryClient.invalidateQueries({ queryKey: ["branding"] });
      toast.success("Logo uploaded and saved.");
    } catch (e: any) {
      toast.error(e.message || "Upload failed.");
    } finally {
      setUploading((p) => ({ ...p, [key]: false }));
    }
  };

  const removeLogo = async (key: string) => {
    const prev = logos[key] || "";
    setLogos((p) => {
      const next = { ...p };
      delete next[key];
      return next;
    });

    try {
      await persistBrandingField(key, "");
      queryClient.invalidateQueries({ queryKey: ["branding"] });
      toast.success("Logo removed and saved.");
    } catch {
      setLogos((p) => ({ ...p, [key]: prev }));
      toast.error("Failed to remove logo.");
    }
  };

  const openMediaFor = (key: string) => {
    setMediaTargetKey(key);
    setMediaModalOpen(true);
  };

  const handleMediaSelect = async (file: MediaFile) => {
    if (!mediaTargetKey) return;

    const key = mediaTargetKey;
    const canonicalUrl = file.file_path
      ? getAdminMediaUrl(file.file_path)
      : toBrandedUrl(file.url);
    const url = `${normalizeBrandingUrl(canonicalUrl)}?t=${Date.now()}`;
    setLogos((p) => ({ ...p, [key]: url }));

    try {
      await persistBrandingField(key, url);
      queryClient.invalidateQueries({ queryKey: ["branding"] });
      toast.success("Media selected and saved.");
    } catch {
      toast.error("Failed to save selected media.");
    }
  };

  const saveBranding = async () => {
    setSaving(true);
    try {
      for (const field of BRANDING_FIELDS) {
        const value = logos[field.key] || "";
        await persistBrandingField(field.key, value);
      }
      queryClient.invalidateQueries({ queryKey: ["branding"] });
      toast.success("Branding settings saved!");
    } catch {
      toast.error("Failed to save branding.");
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
        <h3 className="text-base font-semibold text-foreground mb-1">Logo & Branding</h3>
        <p className="text-xs text-muted-foreground">Manage your site-wide visual assets. Logos will appear in the header, footer, favicon, and invoices. Add a homepage hero image here to update the home hero background.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {BRANDING_FIELDS.map((field) => (
          <div key={field.key} className="border border-border rounded-xl p-4 space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground">{field.label}</label>
              <p className="text-xs text-muted-foreground">{field.desc}</p>
            </div>

            {logos[field.key] ? (
              <div className="flex items-start gap-4">
                <div className={`border border-border rounded-lg p-2 ${field.key === "footer_logo" ? "bg-foreground" : "bg-white"}`}>
                  <img
                    src={logos[field.key]}
                    alt={field.label}
                    className="max-w-[160px] max-h-[80px] object-contain"
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <p className="text-xs text-muted-foreground break-all line-clamp-2">
                    {isDataUrl(logos[field.key]) ? `local://branding/${field.key}` : toBrandedUrl(logos[field.key])}
                  </p>
                  <div className="flex gap-2">
                    <label className="cursor-pointer">
                      <Button variant="outline" size="sm" className="gap-1 pointer-events-none">
                        <Upload className="w-3.5 h-3.5" /> Replace
                      </Button>
                      <input
                        type="file"
                        accept={field.accept}
                        className="hidden"
                        disabled={uploading[field.key]}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUpload(field.key, f);
                        }}
                      />
                    </label>
                    <Button variant="outline" size="sm" onClick={() => void removeLogo(field.key)} className="gap-1">
                      <X className="w-3.5 h-3.5" /> Remove
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-colors">
                  {uploading[field.key] ? (
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-muted-foreground/50 mb-2" />
                      <span className="text-sm text-muted-foreground">Click to upload</span>
                      <span className="text-xs text-muted-foreground/70 mt-1">{field.accept.replace(/\./g, "").toUpperCase()}</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept={field.accept}
                    className="hidden"
                    disabled={uploading[field.key]}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(field.key, f);
                    }}
                  />
                </label>
                <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={() => openMediaFor(field.key)}>
                  <FolderOpen className="w-4 h-4" /> Select from Media Library
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Button onClick={saveBranding} disabled={saving} className="gap-2">
        {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Branding
      </Button>

      <MediaLibraryModal
        open={mediaModalOpen}
        onOpenChange={setMediaModalOpen}
        onSelect={handleMediaSelect}
      />
    </div>
  );
};

/** Compress image using canvas */
const compressImage = (file: File, maxDim: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      const mimeType = file.type.includes("png") ? "image/png" : file.type.includes("webp") ? "image/webp" : "image/jpeg";
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Compression failed"));
        },
        mimeType,
        0.85
      );
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

export default BrandingSection;
