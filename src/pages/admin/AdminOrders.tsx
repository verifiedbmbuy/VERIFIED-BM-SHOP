import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toBrandedUrl } from "@/lib/imageUtils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, Eye, CheckCircle, XCircle, Package, Image as ImageIcon, Download } from "lucide-react";
import { format } from "date-fns";
import { generateInvoicePDF } from "@/lib/invoiceGenerator";

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  currency: string;
  status: string;
  payment_method: string;
  proof_image_url: string | null;
  proof_uploaded_at: string | null;
  admin_notes: string | null;
  cryptomus_invoice_id: string | null;
  created_at: string;
  paid_at: string | null;
}

interface OrderItem {
  id: string;
  product_title: string;
  unit_price: number;
  quantity: number;
  product_id: string;
}

// Uniform status pipeline
const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  created: { label: "Created", variant: "outline" },
  processing: { label: "Processing", variant: "secondary", className: "bg-[hsl(45,93%,47%)]/15 text-[hsl(45,80%,35%)] border-[hsl(45,93%,47%)]/30" },
  completed: { label: "Completed", variant: "default", className: "bg-[hsl(142,70%,45%)]/15 text-[hsl(142,60%,35%)] border-[hsl(142,70%,45%)]/30" },
  failed: { label: "Failed", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [proofOpen, setProofOpen] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setOrders(data as Order[]);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const openOrder = async (order: Order) => {
    setSelectedOrder(order);
    setAdminNotes(order.admin_notes || "");
    const { data } = await supabase.from("order_items").select("*").eq("order_id", order.id);
    setOrderItems((data || []) as OrderItem[]);
  };

  const reduceStock = async (items: OrderItem[]) => {
    for (const item of items) {
      const { data: product } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", item.product_id)
        .single();
      if (product) {
        const newQty = Math.max(0, product.stock_quantity - item.quantity);
        await supabase
          .from("products")
          .update({ stock_quantity: newQty, stock_status: newQty === 0 ? "out_of_stock" : "in_stock" })
          .eq("id", item.product_id);
      }
    }
  };

  const restoreStock = async (items: OrderItem[]) => {
    for (const item of items) {
      const { data: product } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", item.product_id)
        .single();
      if (product) {
        const newQty = product.stock_quantity + item.quantity;
        await supabase
          .from("products")
          .update({ stock_quantity: newQty, stock_status: "in_stock" })
          .eq("id", item.product_id);
      }
    }
  };

  const approvePayment = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    const { error } = await supabase
      .from("orders")
      .update({ status: "completed", paid_at: new Date().toISOString(), admin_notes: adminNotes || null })
      .eq("id", selectedOrder.id);

    if (error) {
      toast.error("Failed to approve payment.");
    } else {
      await reduceStock(orderItems);
      toast.success("Payment approved and stock updated!");
      setSelectedOrder(null);
      fetchOrders();
    }
    setSaving(false);
  };

  const cancelOrder = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    const wasCompleted = selectedOrder.status === "completed";
    const { error } = await supabase
      .from("orders")
      .update({ status: "cancelled", admin_notes: adminNotes || null })
      .eq("id", selectedOrder.id);
    if (error) {
      toast.error("Failed to cancel order.");
    } else {
      if (wasCompleted) await restoreStock(orderItems);
      toast.success("Order cancelled." + (wasCompleted ? " Stock restored." : ""));
      setSelectedOrder(null);
      fetchOrders();
    }
    setSaving(false);
  };

  const markFailed = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    const wasCompleted = selectedOrder.status === "completed";
    const { error } = await supabase
      .from("orders")
      .update({ status: "failed", admin_notes: adminNotes || null })
      .eq("id", selectedOrder.id);
    if (error) {
      toast.error("Failed to update order.");
    } else {
      if (wasCompleted) await restoreStock(orderItems);
      toast.success("Order marked as failed." + (wasCompleted ? " Stock restored." : ""));
      setSelectedOrder(null);
      fetchOrders();
    }
    setSaving(false);
  };

  const handleDownloadInvoice = async (order: Order) => {
    setDownloading(order.id);
    try {
      const { data: items } = await supabase.from("order_items").select("product_title, unit_price, quantity").eq("order_id", order.id);
      await generateInvoicePDF(order, items || []);
    } catch (e: any) {
      toast.error("Failed to generate invoice: " + e.message);
    } finally {
      setDownloading(null);
    }
  };

  const saveNotes = async () => {
    if (!selectedOrder) return;
    const { error } = await supabase
      .from("orders")
      .update({ admin_notes: adminNotes || null })
      .eq("id", selectedOrder.id);
    if (error) toast.error("Failed to save notes.");
    else toast.success("Notes saved.");
  };

  const filtered = orders
    .filter((o) =>
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_email.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase())
    )
    .filter((o) => statusFilter === "all" || o.status === statusFilter);

  const getStatusBadge = (status: string) => {
    const cfg = statusConfig[status] || { label: status, variant: "outline" as const };
    return <Badge variant={cfg.variant} className={cfg.className}>{cfg.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Orders</h2>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders…" className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="created">Created</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-background rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No orders found</h3>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead className="hidden sm:table-cell">Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Method</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => (
                <TableRow key={order.id} className={order.status === "processing" ? "bg-[hsl(45,93%,47%)]/5" : ""}>
                  <TableCell>
                    <div>
                      <span className="font-mono text-xs text-muted-foreground">{order.id.slice(0, 8)}…</span>
                      <span className="block text-xs text-muted-foreground">{format(new Date(order.created_at), "MMM d, HH:mm")}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div>
                      <span className="text-sm font-medium text-foreground">{order.customer_name}</span>
                      <span className="block text-xs text-muted-foreground">{order.customer_email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">${order.total_amount}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground capitalize">{order.payment_method}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openOrder(order)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      {(order.status === "completed") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={downloading === order.id}
                          onClick={() => handleDownloadInvoice(order)}
                          title="Download Invoice"
                        >
                          <Download className={`w-4 h-4 ${downloading === order.id ? "animate-pulse" : ""}`} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(o) => !o && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Order Details</DialogTitle></DialogHeader>
          {selectedOrder && (
            <div className="space-y-6 pt-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Order ID</span>
                  <p className="font-mono text-foreground">{selectedOrder.id.slice(0, 16)}…</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status</span>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Customer</span>
                  <p className="text-foreground font-medium">{selectedOrder.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedOrder.customer_email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Amount</span>
                  <p className="text-lg font-bold text-foreground">${selectedOrder.total_amount} {selectedOrder.currency}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Payment Method</span>
                  <p className="text-foreground capitalize">{selectedOrder.payment_method}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Date</span>
                  <p className="text-foreground">{format(new Date(selectedOrder.created_at), "PPp")}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Items</h4>
                <div className="bg-secondary/30 rounded-lg p-3 space-y-2">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-foreground">{item.product_title} ×{item.quantity}</span>
                      <span className="font-medium text-foreground">${(item.unit_price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.proof_image_url && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Payment Proof</h4>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => { setProofUrl(selectedOrder.proof_image_url!); setProofOpen(true); }}>
                      <ImageIcon className="w-4 h-4" /> View Proof
                    </Button>
                    {selectedOrder.proof_uploaded_at && (
                      <span className="text-xs text-muted-foreground">Uploaded {format(new Date(selectedOrder.proof_uploaded_at), "PPp")}</span>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Admin Notes</h4>
                <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Internal notes…" rows={3} />
                <Button variant="outline" size="sm" onClick={saveNotes} className="mt-2">Save Notes</Button>
              </div>

              {/* Status Pipeline Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
                {(selectedOrder.status === "completed") && (
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadInvoice(selectedOrder)}
                    disabled={downloading === selectedOrder.id}
                    className="gap-2"
                  >
                    <Download className={`w-4 h-4 ${downloading === selectedOrder.id ? "animate-pulse" : ""}`} />
                    Download Invoice
                  </Button>
                )}
                {(selectedOrder.status === "created" || selectedOrder.status === "processing") && (
                  <Button onClick={approvePayment} disabled={saving} className="gap-2 bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white">
                    <CheckCircle className="w-4 h-4" /> Mark Completed
                  </Button>
                )}
                {selectedOrder.status !== "completed" && selectedOrder.status !== "failed" && selectedOrder.status !== "cancelled" && (
                  <Button variant="outline" onClick={markFailed} disabled={saving} className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/5">
                    <XCircle className="w-4 h-4" /> Mark Failed
                  </Button>
                )}
                {selectedOrder.status !== "cancelled" && (
                  <Button variant="destructive" onClick={cancelOrder} disabled={saving} className="gap-2">
                    <XCircle className="w-4 h-4" /> Cancel Order
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={proofOpen} onOpenChange={setProofOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Payment Proof</DialogTitle></DialogHeader>
          <img src={toBrandedUrl(proofUrl)} alt="Payment proof" className="w-full rounded-lg" />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
