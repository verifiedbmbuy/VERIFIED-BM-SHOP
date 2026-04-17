import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

const EmailSettingsSection = () => {
  const [provider, setProvider] = useState("resend");
  const [apiKey, setApiKey] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["email_provider", "email_api_key", "email_from_address"]);
      if (data) {
        for (const row of data) {
          if (row.key === "email_provider") setProvider(row.value);
          if (row.key === "email_api_key") setApiKey(row.value);
          if (row.key === "email_from_address") setFromEmail(row.value);
        }
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!apiKey.trim() || !fromEmail.trim()) {
      toast.error("API Key and From Email are required.");
      return;
    }
    setSaving(true);
    try {
      const settings = [
        { key: "email_provider", value: provider },
        { key: "email_api_key", value: apiKey.trim() },
        { key: "email_from_address", value: fromEmail.trim() },
      ];
      for (const setting of settings) {
        const { data: existing } = await supabase
          .from("site_settings")
          .select("key")
          .eq("key", setting.key)
          .single();
        if (existing) {
          await supabase
            .from("site_settings")
            .update({ value: setting.value, updated_at: new Date().toISOString() })
            .eq("key", setting.key);
        } else {
          await supabase.from("site_settings").insert(setting);
        }
      }
      toast.success("Email settings saved!");
    } catch {
      toast.error("Failed to save email settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-4 text-muted-foreground text-sm">Loading…</div>;

  return (
    <div className="border-t border-border pt-5 mt-5">
      <div className="flex items-center gap-2 mb-1">
        <Mail className="w-4 h-4 text-primary" />
        <h3 className="text-base font-semibold text-foreground">Email Service Provider</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Configure your email provider to send newsletters and notifications.
      </p>
      <div className="space-y-4 max-w-lg">
        <div>
          <Label className="mb-1.5 block">Provider</Label>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="resend">Resend</SelectItem>
              <SelectItem value="sendgrid">SendGrid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1.5 block">API Key <span className="text-destructive">*</span></Label>
          <div className="relative">
            <Input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={provider === "resend" ? "re_xxxx…" : "SG.xxxx…"}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <Label className="mb-1.5 block">From Email <span className="text-destructive">*</span></Label>
          <Input
            type="email"
            value={fromEmail}
            onChange={(e) => setFromEmail(e.target.value)}
            placeholder="noreply@yourdomain.com"
          />
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Email Settings
        </Button>
      </div>
    </div>
  );
};

export default EmailSettingsSection;
