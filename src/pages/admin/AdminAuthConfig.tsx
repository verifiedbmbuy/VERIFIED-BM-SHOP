import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldCheck, ShieldAlert, Save, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface AuthCredentials {
  facebook_app_id: string;
  facebook_app_secret: string;
  google_client_id: string;
  google_client_secret: string;
  apple_service_id: string;
  apple_private_key: string;
}

const SETTINGS_KEYS = [
  "auth_facebook_app_id",
  "auth_facebook_app_secret",
  "auth_google_client_id",
  "auth_google_client_secret",
  "auth_apple_service_id",
  "auth_apple_private_key",
];

const AdminAuthConfig = () => {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [creds, setCreds] = useState<AuthCredentials>({
    facebook_app_id: "",
    facebook_app_secret: "",
    google_client_id: "",
    google_client_secret: "",
    apple_service_id: "",
    apple_private_key: "",
  });

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", SETTINGS_KEYS);

      if (data) {
        const map: Record<string, string> = {};
        data.forEach((r) => { map[r.key] = r.value; });
        setCreds({
          facebook_app_id: map.auth_facebook_app_id || "",
          facebook_app_secret: map.auth_facebook_app_secret || "",
          google_client_id: map.auth_google_client_id || "",
          google_client_secret: map.auth_google_client_secret || "",
          apple_service_id: map.auth_apple_service_id || "",
          apple_private_key: map.auth_apple_private_key || "",
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const entries = [
      { key: "auth_facebook_app_id", value: creds.facebook_app_id },
      { key: "auth_facebook_app_secret", value: creds.facebook_app_secret },
      { key: "auth_google_client_id", value: creds.google_client_id },
      { key: "auth_google_client_secret", value: creds.google_client_secret },
      { key: "auth_apple_service_id", value: creds.apple_service_id },
      { key: "auth_apple_private_key", value: creds.apple_private_key },
    ];

    for (const entry of entries) {
      await supabase
        .from("site_settings")
        .upsert({ key: entry.key, value: entry.value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    }

    toast.success("Auth credentials saved successfully!");
    setSaving(false);
  };

  const toggleSecret = (field: string) => {
    setShowSecrets((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  if (role !== "admin") {
    return (
      <div className="p-16 text-center">
        <ShieldAlert className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-1">Access Denied</h3>
        <p className="text-sm text-muted-foreground">Only administrators can manage auth settings.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> Loading settings…
      </div>
    );
  }

  const SecretInput = ({ label, field, placeholder }: { label: string; field: keyof AuthCredentials; placeholder: string }) => (
    <div>
      <label className="text-sm font-medium text-foreground mb-1.5 block">{label}</label>
      <div className="relative">
        <Input
          type={showSecrets[field] ? "text" : "password"}
          value={creds[field]}
          onChange={(e) => setCreds((prev) => ({ ...prev, [field]: e.target.value }))}
          placeholder={placeholder}
          className="pr-10 font-mono text-sm"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => toggleSecret(field)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={showSecrets[field] ? "Hide value" : "Show value"}
        >
          {showSecrets[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Auth Configuration</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure OAuth provider credentials for Facebook, Google, and Apple sign-in.
        </p>
      </div>

      {/* Facebook */}
      <section className="bg-background rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#1877F2]/10 flex items-center justify-center text-[#1877F2]">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5h1.7V5c-.3 0-1.4-.1-2.6-.1-2.6 0-4.3 1.6-4.3 4.5V11H7v3h2.9v8h3.6z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Facebook OAuth</h3>
            <p className="text-xs text-muted-foreground">From Meta for Developers → App Settings → Basic</p>
          </div>
        </div>
        <SecretInput label="App ID" field="facebook_app_id" placeholder="123456789012345" />
        <SecretInput label="App Secret" field="facebook_app_secret" placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
      </section>

      {/* Google */}
      <section className="bg-background rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Google OAuth</h3>
            <p className="text-xs text-muted-foreground">From Google Cloud Console → APIs & Services → Credentials</p>
          </div>
        </div>
        <SecretInput label="Client ID" field="google_client_id" placeholder="xxxx.apps.googleusercontent.com" />
        <SecretInput label="Client Secret" field="google_client_secret" placeholder="GOCSPX-xxxxxxxxxx" />
      </section>

      {/* Apple */}
      <section className="bg-background rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-foreground/5 flex items-center justify-center">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Apple Sign In</h3>
            <p className="text-xs text-muted-foreground">From Apple Developer Console → Certificates, Identifiers & Profiles</p>
          </div>
        </div>
        <SecretInput label="Service ID" field="apple_service_id" placeholder="com.yourapp.service" />
        <SecretInput label="Private Key" field="apple_private_key" placeholder="-----BEGIN PRIVATE KEY-----" />
      </section>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Credentials
      </Button>
    </div>
  );
};

export default AdminAuthConfig;
