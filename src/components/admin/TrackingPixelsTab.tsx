import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";

const TRACKING_KEYS = [
  "tracking_ga4_id",
  "tracking_gtm_id",
  "tracking_google_ads_id",
  "tracking_fb_pixel_id",
  "tracking_fb_capi_token",
  "tracking_fb_test_event",
  "tracking_header_scripts",
  "tracking_footer_scripts",
] as const;

type TrackingKey = typeof TRACKING_KEYS[number];

const StatusBadge = ({ active }: { active: boolean }) => (
  <Badge variant={active ? "default" : "secondary"} className="text-xs gap-1 ml-2">
    {active ? <><Check className="w-3 h-3" /> Active</> : <><X className="w-3 h-3" /> Inactive</>}
  </Badge>
);

const TrackingPixelsTab = () => {
  const [values, setValues] = useState<Record<TrackingKey, string>>({
    tracking_ga4_id: "",
    tracking_gtm_id: "",
    tracking_google_ads_id: "",
    tracking_fb_pixel_id: "",
    tracking_fb_capi_token: "",
    tracking_fb_test_event: "",
    tracking_header_scripts: "",
    tracking_footer_scripts: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", [...TRACKING_KEYS]);
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((r) => { map[r.key] = r.value; });
        setValues((prev) => ({ ...prev, ...map }));
      }
      setLoading(false);
    };
    load();
  }, []);

  const update = (key: TrackingKey, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const key of TRACKING_KEYS) {
        const val = values[key].trim();
        const { data: existing } = await supabase
          .from("site_settings")
          .select("key")
          .eq("key", key)
          .single();

        if (val) {
          if (existing) {
            await supabase.from("site_settings").update({ value: val, updated_at: new Date().toISOString() }).eq("key", key);
          } else {
            await supabase.from("site_settings").insert({ key, value: val });
          }
        } else if (existing) {
          await supabase.from("site_settings").delete().eq("key", key);
        }
      }
      toast.success("Tracking settings saved!");
    } catch {
      toast.error("Failed to save tracking settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="bg-background rounded-xl border border-border p-6 space-y-8 mt-4">
      {/* Google Suite */}
      <div>
        <h3 className="text-base font-semibold text-foreground mb-1">Google Suite</h3>
        <p className="text-xs text-muted-foreground mb-4">Configure Google Analytics, Tag Manager, and Ads tracking.</p>
        <div className="space-y-4">
          <div>
            <div className="flex items-center">
              <label className="text-sm font-medium text-foreground">Google Analytics (GA4) Measurement ID</label>
              <StatusBadge active={!!values.tracking_ga4_id.trim()} />
            </div>
            <Input value={values.tracking_ga4_id} onChange={(e) => update("tracking_ga4_id", e.target.value)} placeholder="G-XXXXXXXXXX" className="mt-1.5 font-mono" />
          </div>
          <div>
            <div className="flex items-center">
              <label className="text-sm font-medium text-foreground">Google Tag Manager Container ID</label>
              <StatusBadge active={!!values.tracking_gtm_id.trim()} />
            </div>
            <Input value={values.tracking_gtm_id} onChange={(e) => update("tracking_gtm_id", e.target.value)} placeholder="GTM-XXXXXXX" className="mt-1.5 font-mono" />
          </div>
          <div>
            <div className="flex items-center">
              <label className="text-sm font-medium text-foreground">Google Ads Conversion ID</label>
              <StatusBadge active={!!values.tracking_google_ads_id.trim()} />
            </div>
            <Input value={values.tracking_google_ads_id} onChange={(e) => update("tracking_google_ads_id", e.target.value)} placeholder="AW-XXXXXXXXX" className="mt-1.5 font-mono" />
          </div>
        </div>
      </div>

      {/* Meta / Facebook */}
      <div className="border-t border-border pt-6">
        <h3 className="text-base font-semibold text-foreground mb-1">Meta (Facebook) Integration</h3>
        <p className="text-xs text-muted-foreground mb-4">Configure Facebook Pixel and Conversions API for server-side tracking.</p>
        <div className="space-y-4">
          <div>
            <div className="flex items-center">
              <label className="text-sm font-medium text-foreground">Facebook Pixel ID</label>
              <StatusBadge active={!!values.tracking_fb_pixel_id.trim()} />
            </div>
            <Input value={values.tracking_fb_pixel_id} onChange={(e) => update("tracking_fb_pixel_id", e.target.value)} placeholder="123456789012345" className="mt-1.5 font-mono" />
          </div>
          <div>
            <div className="flex items-center">
              <label className="text-sm font-medium text-foreground">Conversions API Access Token</label>
              <StatusBadge active={!!values.tracking_fb_capi_token.trim()} />
            </div>
            <Input type="password" value={values.tracking_fb_capi_token} onChange={(e) => update("tracking_fb_capi_token", e.target.value)} placeholder="EAAxxxxxxxxxx…" className="mt-1.5 font-mono" />
            <p className="text-xs text-muted-foreground mt-1">Used for server-side event tracking to bypass ad-blockers on Hostinger.</p>
          </div>
          <div>
            <div className="flex items-center">
              <label className="text-sm font-medium text-foreground">Test Event Code</label>
              <StatusBadge active={!!values.tracking_fb_test_event.trim()} />
            </div>
            <Input value={values.tracking_fb_test_event} onChange={(e) => update("tracking_fb_test_event", e.target.value)} placeholder="TEST12345" className="mt-1.5 font-mono" />
            <p className="text-xs text-muted-foreground mt-1">Use during testing only. Remove for production.</p>
          </div>
        </div>
      </div>

      {/* Custom Scripts */}
      <div className="border-t border-border pt-6">
        <h3 className="text-base font-semibold text-foreground mb-1">Custom Scripts</h3>
        <p className="text-xs text-muted-foreground mb-4">Add custom tracking scripts for LinkedIn, Twitter, Hotjar, or chat widgets. Scripts only load on your production domain.</p>
        <div className="space-y-4">
          <div>
            <div className="flex items-center">
              <label className="text-sm font-medium text-foreground">Header Scripts (loads in &lt;head&gt;)</label>
              <StatusBadge active={!!values.tracking_header_scripts.trim()} />
            </div>
            <Textarea
              value={values.tracking_header_scripts}
              onChange={(e) => update("tracking_header_scripts", e.target.value)}
              placeholder={'<!-- Paste <script> tags here -->'}
              rows={5}
              className="mt-1.5 font-mono text-xs"
            />
          </div>
          <div>
            <div className="flex items-center">
              <label className="text-sm font-medium text-foreground">Footer Scripts (loads before &lt;/body&gt;)</label>
              <StatusBadge active={!!values.tracking_footer_scripts.trim()} />
            </div>
            <Textarea
              value={values.tracking_footer_scripts}
              onChange={(e) => update("tracking_footer_scripts", e.target.value)}
              placeholder={'<!-- Paste <script> tags here -->'}
              rows={5}
              className="mt-1.5 font-mono text-xs"
            />
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Performance Note:</strong> All tracking scripts are lazy-loaded and only execute on your production domain. They are automatically disabled in development/preview mode to prevent polluting your analytics data with test traffic.
        </p>
      </div>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Tracking Settings
      </Button>
    </div>
  );
};

export default TrackingPixelsTab;
