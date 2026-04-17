import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Download, Shield } from "lucide-react";
import { toast } from "sonner";
import { logAction } from "@/lib/auditLog";

const MaintenanceTab = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "maintenance_mode")
        .maybeSingle();
      if (data) setMaintenanceMode(data.value === "true");
      setLoading(false);
    };
    load();
  }, []);

  const toggleMaintenance = async (enabled: boolean) => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from("site_settings")
        .select("key")
        .eq("key", "maintenance_mode")
        .single();

      if (existing) {
        await supabase.from("site_settings").update({ value: String(enabled), updated_at: new Date().toISOString() }).eq("key", "maintenance_mode");
      } else {
        await supabase.from("site_settings").insert({ key: "maintenance_mode", value: String(enabled) });
      }

      setMaintenanceMode(enabled);
      await logAction(enabled ? "Enable Maintenance" : "Disable Maintenance", "Settings");
      toast.success(`Maintenance mode ${enabled ? "enabled" : "disabled"}.`);
    } catch {
      toast.error("Failed to update.");
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = async (type: "orders" | "customers") => {
    setExporting(true);
    try {
      let csvContent = "";
      let recordCount = 0;

      if (type === "orders") {
        const { data } = await supabase.from("orders").select("id, customer_name, customer_email, total_amount, currency, payment_method, status, created_at").order("created_at", { ascending: false });
        if (!data || data.length === 0) { toast.info("No orders to export."); return; }
        recordCount = data.length;
        csvContent = "ID,Customer Name,Email,Amount,Currency,Payment Method,Status,Date\n";
        csvContent += data.map((o) =>
          `"${o.id}","${o.customer_name}","${o.customer_email}",${o.total_amount},"${o.currency}","${o.payment_method}","${o.status}","${o.created_at}"`
        ).join("\n");
      } else {
        const { data } = await supabase.from("orders").select("customer_name, customer_email").order("created_at", { ascending: false });
        if (!data || data.length === 0) { toast.info("No customers to export."); return; }
        const seen = new Set<string>();
        const unique = data.filter((c) => {
          if (seen.has(c.customer_email)) return false;
          seen.add(c.customer_email);
          return true;
        });
        recordCount = unique.length;
        csvContent = "Name,Email\n";
        csvContent += unique.map((c) => `"${c.customer_name}","${c.customer_email}"`).join("\n");
      }

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${type}-export-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      await logAction(`Export ${type} CSV`, "Backup", undefined, undefined, { record_count: recordCount });
      toast.success(`${type === "orders" ? "Orders" : "Customers"} exported!`);
    } catch {
      toast.error("Export failed.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading…</div>;

  return (
    <div className="bg-background rounded-xl border border-border p-6 mt-4 space-y-8">
      {/* Maintenance Mode */}
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary mt-0.5" />
          <div className="flex-1">
            <h3 className="text-base font-semibold text-foreground">Maintenance Mode</h3>
            <p className="text-xs text-muted-foreground">When enabled, visitors see a "Under Maintenance" page. Logged-in admins can still access the site.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 pl-8">
          <Switch
            checked={maintenanceMode}
            onCheckedChange={toggleMaintenance}
            disabled={saving}
          />
          <Label className="text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
            {maintenanceMode ? "Maintenance Mode ON" : "Site is Live"}
          </Label>
        </div>
        {maintenanceMode && (
          <div className="ml-8 p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-200">
            ⚠️ Your site is currently showing a maintenance page to all visitors. Only logged-in admins can see the live site.
          </div>
        )}
      </div>

      {/* Data Export */}
      <div className="border-t border-border pt-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Data Export</h3>
          <p className="text-xs text-muted-foreground">Download your data as CSV files for backup or migration.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => exportCSV("orders")} disabled={exporting} className="gap-2">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export Orders
          </Button>
          <Button variant="outline" onClick={() => exportCSV("customers")} disabled={exporting} className="gap-2">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export Customers
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceTab;
