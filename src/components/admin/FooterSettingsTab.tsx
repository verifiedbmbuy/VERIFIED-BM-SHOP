import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const FOOTER_KEYS = [
  "footer_description",
  "contact_address",
  "contact_phone",
  "contact_telegram",
  "contact_email",
  "footer_copyright_text",
] as const;

const FooterSettingsTab = () => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", [...FOOTER_KEYS]);
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((r) => { map[r.key] = r.value; });
        setValues(map);
      }
      setLoading(false);
    };
    load();
  }, []);

  const set = (key: string, val: string) => setValues((p) => ({ ...p, [key]: val }));

  const save = async () => {
    setSaving(true);
    try {
      for (const key of FOOTER_KEYS) {
        const value = values[key] || "";
        const { data: existing } = await supabase
          .from("site_settings")
          .select("key")
          .eq("key", key)
          .single();
        if (existing) {
          await supabase.from("site_settings").update({ value, updated_at: new Date().toISOString() }).eq("key", key);
        } else if (value) {
          await supabase.from("site_settings").insert({ key, value });
        }
      }
      toast.success("Footer settings saved!");
    } catch {
      toast.error("Failed to save footer settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-foreground mb-1">Footer Content</h3>
        <p className="text-xs text-muted-foreground">Manage the text and contact details shown in your site footer.</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Brand Description</label>
          <p className="text-xs text-muted-foreground mb-1">Appears below the logo in the footer. Describe your business in 1–2 sentences.</p>
          <Textarea
            value={values.footer_description || ""}
            onChange={(e) => set("footer_description", e.target.value)}
            rows={3}
            placeholder="Trusted provider of verified Meta Business Managers…"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Address</label>
          <Textarea
            value={values.contact_address || ""}
            onChange={(e) => set("contact_address", e.target.value)}
            rows={2}
            placeholder="Madergonj, Pirgonj, Rangpur, Bangladesh - 5470"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Phone / WhatsApp</label>
            <Input
              value={values.contact_phone || ""}
              onChange={(e) => set("contact_phone", e.target.value)}
              placeholder="+880 1302 669333"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Telegram Username</label>
            <p className="text-xs text-muted-foreground mb-1">Without the @ symbol, e.g. Verifiedbmbuy</p>
            <Input
              value={values.contact_telegram || ""}
              onChange={(e) => set("contact_telegram", e.target.value)}
              placeholder="Verifiedbmbuy"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Contact Email</label>
          <Input
            value={values.contact_email || ""}
            onChange={(e) => set("contact_email", e.target.value)}
            placeholder="info@verifiedbm.shop"
          />
        </div>

        <div className="border-t border-border pt-5">
          <label className="text-sm font-medium text-foreground mb-1.5 block">Copyright Text</label>
          <p className="text-xs text-muted-foreground mb-1">Shown in the bottom bar. Use {"{year}"} for the current year.</p>
          <Input
            value={values.footer_copyright_text || ""}
            onChange={(e) => set("footer_copyright_text", e.target.value)}
            placeholder="© {year} Verified BM Shop. All rights reserved."
          />
        </div>
      </div>

      <Button onClick={save} disabled={saving} className="gap-2">
        {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Footer Settings
      </Button>
    </div>
  );
};

export default FooterSettingsTab;
