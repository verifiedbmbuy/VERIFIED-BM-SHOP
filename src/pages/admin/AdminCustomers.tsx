import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search, Users, ArrowLeft, ChevronLeft, ChevronRight,
  Download, Upload, FileDown, FileJson, FileText, AlertTriangle, CheckCircle2, X,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Types ───────────────────────────────────────────────────────────
interface CustomerProfile {
  id: string;
  full_name: string;
  email: string | null;
  is_active: boolean;
  created_at: string;
}

interface OrderWithItems {
  id: string;
  total_amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  currency: string;
  items: { product_title: string; quantity: number; unit_price: number }[];
}

interface ImportRow {
  full_name: string;
  email: string;
  is_active?: boolean;
  valid: boolean;
  error?: string;
}

const PER_PAGE = 15;
const ACCEPTED_CSV = ".csv,text/csv,application/vnd.ms-excel";

// ─── Helpers ─────────────────────────────────────────────────────────
const downloadBlob = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const parseCSV = (text: string): string[][] => {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  return lines.map((line) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  });
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Component ───────────────────────────────────────────────────────
const AdminCustomers = () => {
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const [profiles, setProfiles] = useState<CustomerProfile[]>([]);
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>({});
  const [totalSpent, setTotalSpent] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);

  // Detail modal
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [customerOrders, setCustomerOrders] = useState<OrderWithItems[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Import modal
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ─── Load data ─────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, full_name, email, is_active, created_at")
      .order("created_at", { ascending: false });

    const allProfiles = profilesData || [];
    setProfiles(allProfiles);

    if (allProfiles.length > 0) {
      const emails = allProfiles.map((p) => p.email).filter(Boolean) as string[];
      if (emails.length > 0) {
        const { data: orders } = await supabase
          .from("orders")
          .select("customer_email, total_amount")
          .in("customer_email", emails);
        const counts: Record<string, number> = {};
        const spent: Record<string, number> = {};
        (orders || []).forEach((o) => {
          const prof = allProfiles.find((p) => p.email === o.customer_email);
          if (prof) {
            counts[prof.id] = (counts[prof.id] || 0) + 1;
            spent[prof.id] = (spent[prof.id] || 0) + Number(o.total_amount);
          }
        });
        setOrderCounts(counts);
        setTotalSpent(spent);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Filtering ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = profiles;
    if (filter === "active") list = list.filter((p) => p.is_active);
    if (filter === "inactive") list = list.filter((p) => !p.is_active);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.full_name.toLowerCase().includes(q) || (p.email && p.email.toLowerCase().includes(q))
      );
    }
    return list;
  }, [profiles, search, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  useEffect(() => { setPage(1); }, [search, filter]);

  // ─── Customer detail ──────────────────────────────────────────────
  const openCustomerDetail = async (customer: CustomerProfile) => {
    setSelectedCustomer(customer);
    setOrdersLoading(true);
    setCustomerOrders([]);
    if (!customer.email) { setOrdersLoading(false); return; }

    const { data: orders } = await supabase
      .from("orders")
      .select("id, total_amount, status, payment_method, created_at, currency")
      .eq("customer_email", customer.email)
      .order("created_at", { ascending: false });

    if (!orders || orders.length === 0) { setOrdersLoading(false); return; }

    const { data: items } = await supabase
      .from("order_items")
      .select("order_id, product_title, quantity, unit_price")
      .in("order_id", orders.map((o) => o.id));

    setCustomerOrders(
      orders.map((o) => ({ ...o, items: (items || []).filter((i) => i.order_id === o.id) }))
    );
    setOrdersLoading(false);
  };

  const statusColor = (s: string) => {
    if (s === "completed") return "default" as const;
    if (s === "pending") return "secondary" as const;
    if (s === "cancelled") return "destructive" as const;
    return "outline" as const;
  };

  // ─── EXPORT ────────────────────────────────────────────────────────
  const exportData = (fmt: "csv" | "json") => {
    if (!isAdmin) return;
    const rows = filtered.map((c) => ({
      full_name: c.full_name,
      email: c.email || "",
      total_spent: (totalSpent[c.id] || 0).toFixed(2),
      order_count: orderCounts[c.id] || 0,
      join_date: format(new Date(c.created_at), "yyyy-MM-dd"),
    }));

    if (fmt === "csv") {
      const header = "Full Name,Email,Total Spent,Order Count,Join Date";
      const csv = [header, ...rows.map((r) =>
        `"${r.full_name}","${r.email}",${r.total_spent},${r.order_count},${r.join_date}`
      )].join("\n");
      downloadBlob(csv, `customers-export-${format(new Date(), "yyyy-MM-dd")}.csv`, "text/csv");
    } else {
      downloadBlob(JSON.stringify(rows, null, 2), `customers-export-${format(new Date(), "yyyy-MM-dd")}.json`, "application/json");
    }
    toast({ title: `Exported ${rows.length} customers as ${fmt.toUpperCase()}` });
  };

  // ─── IMPORT ────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Security: validate file type
    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
      toast({ title: "Invalid file", description: "Only CSV files are accepted.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5 MB allowed.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length < 2) {
        toast({ title: "Empty CSV", description: "The file has no data rows.", variant: "destructive" });
        return;
      }

      const header = rows[0].map((h) => h.toLowerCase().replace(/[^a-z_]/g, ""));
      const nameIdx = header.findIndex((h) => h.includes("name") || h === "full_name");
      const emailIdx = header.findIndex((h) => h.includes("email"));

      if (nameIdx === -1 || emailIdx === -1) {
        toast({ title: "Missing columns", description: "CSV must have 'full_name' and 'email' columns.", variant: "destructive" });
        return;
      }

      const parsed: ImportRow[] = rows.slice(1).map((row) => {
        const name = (row[nameIdx] || "").trim();
        const email = (row[emailIdx] || "").trim();
        let valid = true;
        let error: string | undefined;

        if (!name) { valid = false; error = "Name is required"; }
        else if (!email || !emailRegex.test(email)) { valid = false; error = "Invalid email"; }

        return { full_name: name, email, valid, error };
      });

      setImportRows(parsed);
      setImportOpen(true);
    };
    reader.readAsText(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const confirmImport = async () => {
    if (!isAdmin) return;
    const validRows = importRows.filter((r) => r.valid);
    if (validRows.length === 0) {
      toast({ title: "No valid rows to import", variant: "destructive" });
      return;
    }

    setImporting(true);
    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const row of validRows) {
      // Check if profile already exists by email
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", row.email)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("profiles")
          .update({ full_name: row.full_name })
          .eq("id", existing.id);
        if (error) errors++; else updated++;
      } else {
        // For new profiles, we create via auth (not possible without service role),
        // so we insert into profiles directly with a generated UUID
        const { error } = await supabase
          .from("profiles")
          .insert({ id: crypto.randomUUID(), full_name: row.full_name, email: row.email });
        if (error) errors++; else created++;
      }
    }

    setImporting(false);
    setImportOpen(false);
    setImportRows([]);
    toast({
      title: "Import Complete",
      description: `Created: ${created}, Updated: ${updated}${errors > 0 ? `, Errors: ${errors}` : ""}`,
    });
    loadData();
  };

  // ─── SINGLE CUSTOMER REPORT ────────────────────────────────────────
  const downloadCustomerJSON = () => {
    if (!selectedCustomer) return;
    const data = {
      customer: {
        full_name: selectedCustomer.full_name,
        email: selectedCustomer.email,
        status: selectedCustomer.is_active ? "Active" : "Inactive",
        joined: format(new Date(selectedCustomer.created_at), "PPP"),
      },
      total_spent: customerOrders.reduce((s, o) => s + Number(o.total_amount), 0).toFixed(2),
      orders: customerOrders.map((o) => ({
        id: o.id,
        date: format(new Date(o.created_at), "yyyy-MM-dd"),
        status: o.status,
        payment_method: o.payment_method,
        total: o.total_amount,
        currency: o.currency,
        items: o.items.map((i) => ({ product: i.product_title, qty: i.quantity, price: i.unit_price })),
      })),
    };
    downloadBlob(JSON.stringify(data, null, 2), `customer-${selectedCustomer.email || selectedCustomer.id}.json`, "application/json");
    toast({ title: "Customer report downloaded" });
  };

  const downloadCustomerPDF = () => {
    if (!selectedCustomer) return;
    const doc = new jsPDF();
    const name = selectedCustomer.full_name || "Customer";

    doc.setFontSize(18);
    doc.text(`Customer Report: ${name}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Email: ${selectedCustomer.email || "—"}`, 14, 30);
    doc.text(`Status: ${selectedCustomer.is_active ? "Active" : "Inactive"}`, 14, 36);
    doc.text(`Joined: ${format(new Date(selectedCustomer.created_at), "PPP")}`, 14, 42);
    const spent = customerOrders.reduce((s, o) => s + Number(o.total_amount), 0);
    doc.text(`Total Spent: $${spent.toFixed(2)}   |   Orders: ${customerOrders.length}`, 14, 48);

    if (customerOrders.length > 0) {
      doc.setFontSize(13);
      doc.text("Order History", 14, 60);

      const tableData = customerOrders.flatMap((o) =>
        o.items.length > 0
          ? o.items.map((item, idx) => [
              idx === 0 ? o.id.slice(0, 8) : "",
              idx === 0 ? format(new Date(o.created_at), "MMM d, yyyy") : "",
              item.product_title,
              String(item.quantity),
              `$${item.unit_price.toFixed(2)}`,
              idx === 0 ? o.status : "",
              idx === 0 ? `$${o.total_amount.toFixed(2)}` : "",
            ])
          : [[o.id.slice(0, 8), format(new Date(o.created_at), "MMM d, yyyy"), "—", "—", "—", o.status, `$${o.total_amount.toFixed(2)}`]]
      );

      autoTable(doc, {
        startY: 64,
        head: [["Order ID", "Date", "Product", "Qty", "Price", "Status", "Total"]],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
      });
    }

    doc.save(`customer-report-${selectedCustomer.email || selectedCustomer.id}.pdf`);
    toast({ title: "PDF report downloaded" });
  };

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6" /> Customers
          </h2>
          <p className="text-sm text-muted-foreground">{filtered.length} customers found</p>
        </div>

        {isAdmin && (
          <div className="flex gap-2">
            {/* Export dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-1.5" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportData("csv")}>
                  <FileText className="w-4 h-4 mr-2" /> Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportData("json")}>
                  <FileJson className="w-4 h-4 mr-2" /> Export as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Import button */}
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="w-4 h-4 mr-1.5" /> Import CSV
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED_CSV}
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        )}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "inactive"] as const).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="capitalize">
              {f}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-background border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">No customers found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Orders</TableHead>
                <TableHead className="text-right">Total Spent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Join Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => openCustomerDetail(c)}>
                  <TableCell className="font-medium text-primary hover:underline">{c.full_name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.email || "—"}</TableCell>
                  <TableCell className="text-center font-semibold">{orderCounts[c.id] || 0}</TableCell>
                  <TableCell className="text-right font-semibold">${(totalSpent[c.id] || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(c.created_at), "MMM d, yyyy")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Customer Detail Dialog ── */}
      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4 cursor-pointer" onClick={() => setSelectedCustomer(null)} />
              {selectedCustomer?.full_name || "Customer"} — Order History
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 text-sm mb-4">
            <p><span className="font-medium">Email:</span> {selectedCustomer?.email || "—"}</p>
            <p><span className="font-medium">Status:</span>{" "}
              <Badge variant={selectedCustomer?.is_active ? "default" : "secondary"}>
                {selectedCustomer?.is_active ? "Active" : "Inactive"}
              </Badge>
            </p>
            <p><span className="font-medium">Joined:</span> {selectedCustomer ? format(new Date(selectedCustomer.created_at), "PPP") : ""}</p>
            <p><span className="font-medium">Total Spent:</span> ${selectedCustomer ? (totalSpent[selectedCustomer.id] || 0).toFixed(2) : "0.00"}</p>
          </div>

          {/* Download Report Buttons */}
          {isAdmin && !ordersLoading && (
            <div className="flex gap-2 mb-4">
              <Button size="sm" variant="outline" onClick={downloadCustomerPDF}>
                <FileDown className="w-4 h-4 mr-1.5" /> Download PDF
              </Button>
              <Button size="sm" variant="outline" onClick={downloadCustomerJSON}>
                <FileJson className="w-4 h-4 mr-1.5" /> Download JSON
              </Button>
            </div>
          )}

          {ordersLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : customerOrders.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No orders found for this customer.</p>
          ) : (
            <div className="space-y-4">
              {customerOrders.map((order) => (
                <div key={order.id} className="border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-mono">{order.id.slice(0, 8)}</span>
                    <Badge variant={statusColor(order.status)} className="capitalize">{order.status}</Badge>
                  </div>
                  <div className="text-sm space-y-1">
                    {order.items.length > 0 ? (
                      order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{item.product_title} <span className="text-muted-foreground">×{item.quantity}</span></span>
                          <span className="font-medium">${item.unit_price.toFixed(2)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground italic">No line items</p>
                    )}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border text-sm">
                    <span className="text-muted-foreground">{format(new Date(order.created_at), "MMM d, yyyy")} · {order.payment_method}</span>
                    <span className="font-bold">{order.currency} ${order.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Import Preview Dialog ── */}
      <Dialog open={importOpen} onOpenChange={(open) => { if (!open) { setImportOpen(false); setImportRows([]); } }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" /> Import Preview
            </DialogTitle>
          </DialogHeader>

          <div className="text-sm text-muted-foreground mb-3">
            {importRows.filter((r) => r.valid).length} valid rows, {importRows.filter((r) => !r.valid).length} with errors. Review before importing.
          </div>

          <div className="border border-border rounded-lg overflow-hidden max-h-[50vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importRows.map((row, idx) => (
                  <TableRow key={idx} className={row.valid ? "" : "bg-destructive/5"}>
                    <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                    <TableCell>{row.full_name || <span className="text-muted-foreground italic">empty</span>}</TableCell>
                    <TableCell>{row.email || <span className="text-muted-foreground italic">empty</span>}</TableCell>
                    <TableCell>
                      {row.valid ? (
                        <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="w-3.5 h-3.5" /> Valid</span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-destructive"><AlertTriangle className="w-3.5 h-3.5" /> {row.error}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => { setImportOpen(false); setImportRows([]); }}>
              <X className="w-4 h-4 mr-1.5" /> Cancel
            </Button>
            <Button
              onClick={confirmImport}
              disabled={importing || importRows.filter((r) => r.valid).length === 0}
            >
              {importing ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-1.5" />
              ) : (
                <Upload className="w-4 h-4 mr-1.5" />
              )}
              Import {importRows.filter((r) => r.valid).length} Customers
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCustomers;
