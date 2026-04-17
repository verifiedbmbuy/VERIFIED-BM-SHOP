import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Download, Upload, Plus, ChevronDown, Search, X, FileUp, Loader2, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

/* ─── Types ────────────────────────────────────────────────────────── */

interface Asset {
  id: string;
  name: string;
  type: string;
  status: string;
  assigned_to: string | null;
  daily_spend_limit: number;
  created_at: string;
}

const TYPES = ["e-Commerce", "Ad Account", "Page"];
const STATUSES = ["verified", "restricted"];
const TEAM = ["Akhi Vai", "Shopon", "Tasneem", "Maruf"];

/* ─── Inline Dropdown ──────────────────────────────────────────────── */

const CellDropdown = ({
  value,
  options,
  onChange,
  colorMap,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  colorMap?: Record<string, string>;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const bg = colorMap?.[value] || "bg-gray-100 text-gray-700";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold capitalize cursor-pointer transition-all hover:ring-2 hover:ring-[#2271b1]/20",
          bg
        )}
      >
        {value}
        <ChevronDown className="w-2.5 h-2.5" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={cn(
                "w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 capitalize transition-colors",
                value === opt && "font-bold"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── CSV Parser ───────────────────────────────────────────────────── */

const parseCSV = (text: string): Record<string, string>[] => {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
  return lines.slice(1).map((line) => {
    const values = line.match(/("([^"]*)"|[^,]*)/g)?.map((v) => v.trim().replace(/^"|"$/g, "")) || [];
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] || ""; });
    return row;
  });
};

/* ─── Import Modal ─────────────────────────────────────────────────── */

const ImportModal = ({
  open,
  onClose,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (rows: Record<string, string>[]) => void;
}) => {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [importing, setImporting] = useState(false);

  const handleFile = async (f: File) => {
    setFile(f);
    const text = await f.text();
    const rows = parseCSV(text);
    setPreview(rows.slice(0, 5));
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    const text = await file.text();
    const rows = parseCSV(text);
    onImport(rows);
    toast.success(`Imported ${rows.length} row${rows.length !== 1 ? "s" : ""}`);
    setFile(null);
    setPreview([]);
    setImporting(false);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 animate-in fade-in duration-200" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Import CSV Data</h3>
            <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const f = e.dataTransfer.files[0];
                if (f && f.name.endsWith(".csv")) handleFile(f);
                else toast.error("Please drop a .csv file");
              }}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer",
                dragging ? "border-[#2271b1] bg-[#2271b1]/5" : "border-gray-300 hover:border-gray-400"
              )}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".csv";
                input.onchange = (e) => {
                  const f = (e.target as HTMLInputElement).files?.[0];
                  if (f) handleFile(f);
                };
                input.click();
              }}
            >
              <FileUp className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">
                {file ? file.name : "Drag & drop a CSV file here"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {file ? `${(file.size / 1024).toFixed(1)} KB · ${preview.length}+ rows detected` : "Columns: Name, Type, Status, Assigned To, Daily Spend Limit"}
              </p>
            </div>

            {/* Preview */}
            {preview.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                  <p className="text-[11px] font-semibold text-gray-500">Preview (first {preview.length} rows)</p>
                </div>
                <div className="overflow-x-auto max-h-36">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500">
                        {Object.keys(preview[0]).map((h) => (
                          <th key={h} className="text-left px-2 py-1.5 font-medium capitalize">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          {Object.values(row).map((v, j) => (
                            <td key={j} className="px-2 py-1.5 text-gray-700 truncate max-w-[120px]">{v}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {file && (
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-[#2271b1] hover:bg-[#135e96] text-white text-sm h-9 gap-1.5"
                  onClick={handleImport}
                  disabled={importing}
                >
                  {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {importing ? "Importing…" : `Import ${preview.length}+ Rows`}
                </Button>
                <Button variant="outline" className="text-sm h-9" onClick={() => { setFile(null); setPreview([]); }}>
                  Clear
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

/* ─── Main Component ───────────────────────────────────────────────── */

const AdminAssetTracker = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  const fetchAssets = useCallback(async () => {
    const { data } = await supabase
      .from("assets")
      .select("*")
      .order("created_at", { ascending: false });
    setAssets((data as Asset[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  // Realtime subscription for live sync
  useEffect(() => {
    const channel = supabase
      .channel("assets-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "assets" }, () => {
        fetchAssets();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAssets]);

  const updateAsset = async (id: string, field: string, value: any) => {
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
    const { error } = await supabase.from("assets").update({ [field]: value } as any).eq("id", id);
    if (error) {
      toast.error("Update failed");
      fetchAssets();
    }
  };

  const addAsset = async () => {
    setAdding(true);
    const { error } = await supabase.from("assets").insert({
      name: "New Asset",
      type: "e-Commerce",
      status: "verified",
      assigned_to: TEAM[0],
      daily_spend_limit: 50,
    });
    if (error) toast.error("Failed to add asset");
    else { toast.success("Asset added"); await fetchAssets(); }
    setAdding(false);
  };

  const deleteAsset = async (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
    const { error } = await supabase.from("assets").delete().eq("id", id);
    if (error) { toast.error("Delete failed"); fetchAssets(); }
    else toast.success("Asset deleted");
  };

  const exportCSV = () => {
    const header = "Name,Type,Status,Assigned To,Daily Spend Limit\n";
    const rows = filteredAssets
      .map((a) => `"${a.name}","${a.type}","${a.status}","${a.assigned_to || ""}",${a.daily_spend_limit}`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `assets-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  };

  const filteredAssets = search.trim()
    ? assets.filter((a) =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.assigned_to?.toLowerCase().includes(search.toLowerCase()) ||
        a.type.toLowerCase().includes(search.toLowerCase())
      )
    : assets;

  const statusColors: Record<string, string> = {
    verified: "bg-emerald-100 text-emerald-700",
    restricted: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Asset Tracker</h2>
          <p className="text-sm text-gray-500">Manage all your business assets in one place.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={addAsset}
            disabled={adding}
            className="gap-1.5 bg-[#2271b1] hover:bg-[#135e96] text-white text-xs h-8"
          >
            {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Add Asset
          </Button>
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors border-r border-gray-300"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button
              onClick={() => setImportOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" /> Import Data
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search assets…"
          className="h-8 pl-8 text-xs border-gray-300"
        />
      </div>

      {/* Data Grid */}
      <div className="bg-white rounded-lg border border-[#dcdcde] overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-2">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-gray-500">No assets found. Click "Add Asset" to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f6f7f7] text-gray-500 text-[11px] uppercase tracking-wider">
                  <th className="text-left px-4 py-2.5 font-semibold">Asset Name</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Type</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Assigned To</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Daily Spend</th>
                  <th className="w-10 px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset, idx) => (
                  <tr
                    key={asset.id}
                    className={cn(
                      "border-t border-[#f0f0f1] hover:bg-[#f6f7f7] transition-colors animate-in fade-in duration-200",
                    )}
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <td className="px-4 py-2.5">
                      <input
                        className="bg-transparent text-xs font-medium text-gray-900 border-0 outline-none w-full focus:ring-1 focus:ring-[#2271b1]/30 rounded px-1 -mx-1 py-0.5"
                        defaultValue={asset.name}
                        onBlur={(e) => {
                          if (e.target.value !== asset.name) updateAsset(asset.id, "name", e.target.value);
                        }}
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <CellDropdown
                        value={asset.type}
                        options={TYPES}
                        onChange={(v) => updateAsset(asset.id, "type", v)}
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <CellDropdown
                        value={asset.status}
                        options={STATUSES}
                        onChange={(v) => updateAsset(asset.id, "status", v)}
                        colorMap={statusColors}
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <CellDropdown
                        value={asset.assigned_to || "Unassigned"}
                        options={TEAM}
                        onChange={(v) => updateAsset(asset.id, "assigned_to", v)}
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-[11px] text-gray-400">$</span>
                        <input
                          type="number"
                          className="bg-transparent text-xs text-gray-900 font-medium border-0 outline-none w-20 text-right focus:ring-1 focus:ring-[#2271b1]/30 rounded px-1 py-0.5"
                          defaultValue={asset.daily_spend_limit}
                          onBlur={(e) => {
                            const v = parseFloat(e.target.value) || 0;
                            if (v !== asset.daily_spend_limit) updateAsset(asset.id, "daily_spend_limit", v);
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => deleteAsset(asset.id)}
                        className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filteredAssets.length > 0 && (
          <div className="px-4 py-2.5 border-t border-[#f0f0f1] bg-[#f6f7f7] text-xs text-gray-500 flex items-center justify-between">
            <span>{filteredAssets.length} asset{filteredAssets.length !== 1 ? "s" : ""}</span>
            <span>
              Total daily spend: ${filteredAssets.reduce((s, a) => s + (a.daily_spend_limit || 0), 0).toFixed(2)}
            </span>
          </div>
        )}
      </div>

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={async (rows) => {
          for (const row of rows) {
            const mapped = {
              name: row["name"] || row["asset name"] || "Imported Asset",
              type: row["type"] || "e-Commerce",
              status: row["status"] || "verified",
              assigned_to: row["assigned to"] || row["assigned_to"] || TEAM[0],
              daily_spend_limit: parseFloat(row["daily spend limit"] || row["daily_spend_limit"] || "0") || 0,
            };
            await supabase.from("assets").insert(mapped);
          }
          await fetchAssets();
        }}
      />
    </div>
  );
};

export default AdminAssetTracker;
