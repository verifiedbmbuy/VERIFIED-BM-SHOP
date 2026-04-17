import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { toBrandedUrl } from "@/lib/imageUtils";
import { ArrowLeft, Loader2, Upload, CheckCircle, Copy, AlertCircle, Download, Plus, Minus } from "lucide-react";
import { generateInvoicePDF } from "@/lib/invoiceGenerator";
import DOMPurify from "dompurify";
import { triggerOrderThankYou } from "@/components/layout/OrderThankYouPopup";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CartItem {
  id: string;
  title: string;
  price: number;
  sale_price: number | null;
  quantity: number;
  image_url: string | null;
}

interface PaymentMethod {
  id: string;
  name: string;
  slug: string;
  type: "manual" | "api" | "placeholder";
  is_active: boolean;
  icon: string | null;
  description: string | null;
  instructions: string | null;
  custom_note: string | null;
  config: any;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/jpg"];

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const initialItems: CartItem[] = location.state?.items || [];
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>(initialItems);

  const [step, setStep] = useState<"info" | "payment" | "done">("info");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Auto-fill from auth session
  useEffect(() => {
    if (profile?.full_name) setName(profile.full_name);
    if (user?.email) setEmail(user.email);
  }, [user, profile]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cryptomusUrl, setCryptomusUrl] = useState<string | null>(null);
  const [binancePayId, setBinancePayId] = useState("895693102");
  const [binanceQrUrl, setBinanceQrUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Duplicate order dialog
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);

  const total = checkoutItems.reduce((sum, i) => sum + (i.sale_price || i.price) * i.quantity, 0);

  const updateItemQuantity = (id: string, delta: number) => {
    setCheckoutItems((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(1, Math.min(100, item.quantity + delta)) } : item
        )
    );
  };

  // Load active payment methods from DB
  useEffect(() => {
    const load = async () => {
      setMethodsLoading(true);
      const { data } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      setPaymentMethods((data || []) as PaymentMethod[]);

      // Load Binance settings using get_setting function (bypasses RLS for public access)
      const [payIdRes, qrUrlRes] = await Promise.all([
        supabase.rpc("get_setting", { setting_key: "binance_pay_id" }),
        supabase.rpc("get_setting", { setting_key: "binance_qr_url" }),
      ]);
      if (payIdRes.data) setBinancePayId(payIdRes.data);
      if (qrUrlRes.data) setBinanceQrUrl(qrUrlRes.data);

      setMethodsLoading(false);
    };
    load();
  }, []);

  if (checkoutItems.length === 0) {
    return (
      <Layout>
        <div className="py-24 text-center">
          <p className="text-muted-foreground mb-4">No items to checkout.</p>
          <Button variant="outline" onClick={() => navigate("/shop")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Shop
          </Button>
        </div>
      </Layout>
    );
  }

  const checkForDuplicateOrders = async (): Promise<boolean> => {
    if (!email.trim()) return false;
    const productIds = checkoutItems.map((i) => i.id);
    // Check if user has pending/processing orders
    const { data: pendingOrders } = await supabase
      .from("orders")
      .select("id")
      .eq("customer_email", email.trim().toLowerCase())
      .in("status", ["pending", "processing", "created"]);

    if (!pendingOrders || pendingOrders.length === 0) return false;

    const orderIds = pendingOrders.map((o) => o.id);
    const { data: existingItems } = await supabase
      .from("order_items")
      .select("product_id")
      .in("order_id", orderIds)
      .in("product_id", productIds);

    return !!(existingItems && existingItems.length > 0);
  };

  const createOrder = async (skipDuplicateCheck = false) => {
    if (!name.trim() || !email.trim()) {
      toast.error("Please enter your name and email.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (name.trim().length > 100) {
      toast.error("Name must be under 100 characters.");
      return;
    }
    if (!selectedMethod) {
      toast.error("Please select a payment method.");
      return;
    }
    if (selectedMethod.type === "placeholder") {
      toast.error("This payment method is not available yet.");
      return;
    }

    // Check for duplicate orders
    if (!skipDuplicateCheck) {
      try {
        const hasDuplicate = await checkForDuplicateOrders();
        if (hasDuplicate) {
          setDuplicateDialogOpen(true);
          return;
        }
      } catch {
        // If check fails, proceed anyway
      }
    }

    setLoading(true);
    try {
      // Use server-side order creation with price verification
      const { data: orderResult, error: orderErr } = await supabase.functions.invoke("create-order", {
        body: {
          customer_name: name.trim(),
          customer_email: email.trim(),
          payment_method_slug: selectedMethod.slug,
          items: checkoutItems.map((i) => ({
            product_id: i.id,
            quantity: i.quantity,
          })),
        },
      });

      // Handle edge function errors with friendly messages
      if (orderErr) {
        let friendlyMessage = "Something went wrong while placing your order. Please try again.";
        try {
          // Try to extract the actual error from the response context
          const ctx = (orderErr as any)?.context;
          if (ctx && typeof ctx.json === "function") {
            const body = await ctx.json();
            if (body?.error) friendlyMessage = body.error;
          } else if (orderResult?.error) {
            friendlyMessage = orderResult.error;
          }
        } catch {
          // fallback to default message
        }
        toast.error("Order could not be placed", { description: friendlyMessage });
        setLoading(false);
        return;
      }
      if (orderResult?.error) {
        toast.error("Order could not be placed", { description: orderResult.error });
        setLoading(false);
        return;
      }

      const createdOrderId = orderResult.order_id;
      setOrderId(createdOrderId);

      if (selectedMethod.type === "api" && selectedMethod.slug === "cryptomus") {
        try {
          const { data: fnData, error: fnErr } = await supabase.functions.invoke("create-cryptomus-invoice", {
            body: { order_id: createdOrderId, amount: orderResult.total_amount, currency: "USD" },
          });
          if (fnErr) throw fnErr;
          if (fnData?.url) {
            setCryptomusUrl(fnData.url);
            await supabase.from("orders").update({ status: "processing" }).eq("id", createdOrderId);
          } else if (fnData?.error) {
            toast.error(fnData.error);
          }
        } catch {
          toast.error("Cryptomus is not configured yet. Please contact support.");
        }
      }

      setStep("payment");
      if (selectedMethod?.type === "api") {
        triggerOrderThankYou();
      }
    } catch (err: any) {
      // Catch-all: never show raw technical errors
      const reason = typeof err?.message === "string" && !err.message.includes("Edge Function")
        ? err.message
        : "Something went wrong. Please try again or contact support.";
      toast.error("Order could not be placed", { description: reason });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) { toast.error("Only JPG and PNG images are allowed."); return; }
    if (file.size > MAX_FILE_SIZE) { toast.error("File size must be under 5MB."); return; }
    setProofFile(file);
  };

  const uploadProof = async () => {
    if (!proofFile || !orderId) return;
    setUploading(true);
    try {
      const ext = proofFile.name.split(".").pop();
      const path = `${orderId}/proof.${ext}`;
      const { error: upErr } = await supabase.storage.from("payment-proofs").upload(path, proofFile, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("payment-proofs").getPublicUrl(path);
      const { error: updateErr } = await supabase
        .from("orders")
        .update({
          proof_image_url: urlData.publicUrl,
          proof_uploaded_at: new Date().toISOString(),
          status: "processing",
        })
        .eq("id", orderId);
      if (updateErr) throw updateErr;
      setStep("done");
      triggerOrderThankYou();
      toast.success("Proof uploaded successfully!");
    } catch (err: any) {
      toast.error("Failed to upload proof", { description: err?.message || "Please try again." });
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const isManualMethod = selectedMethod?.type === "manual";

  return (
    <Layout>
      <SEOHead title="Checkout - Verified BM Shop" description="Complete your purchase" />

      {/* Duplicate Order Confirmation Dialog */}
      <AlertDialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>You already have a pending order</AlertDialogTitle>
            <AlertDialogDescription>
              You already have a pending order for this product. Would you like to place an additional order, or view your current order?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => navigate("/dashboard")}>
              View My Orders
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => { setDuplicateDialogOpen(false); createOrder(true); }}>
              Place New Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <section className="py-12">
        <div className="max-w-2xl mx-auto px-4">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <h1 className="text-2xl font-bold text-foreground mb-8">Checkout</h1>

          {/* Order Summary with Quantity Controls */}
          <div className="bg-secondary/30 rounded-xl border border-border p-4 mb-8">
            <h3 className="text-sm font-semibold text-foreground mb-3">Order Summary</h3>
            {checkoutItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  {item.image_url && <img src={toBrandedUrl(item.image_url)} alt={item.title} className="w-10 h-10 rounded object-cover" />}
                  <div>
                    <span className="text-sm font-medium text-foreground">{item.title}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {step === "info" && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateItemQuantity(item.id, -1)}
                        className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-accent transition-colors"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateItemQuantity(item.id, 1)}
                        className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-accent transition-colors"
                        disabled={item.quantity >= 100}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {step !== "info" && (
                    <span className="text-xs text-muted-foreground">×{item.quantity}</span>
                  )}
                  <span className="text-sm font-semibold text-foreground min-w-[60px] text-right">
                    ${((item.sale_price || item.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
            <div className="flex justify-between pt-3 mt-2 border-t border-border">
              <span className="font-semibold text-foreground">Total</span>
              <span className="text-lg font-bold text-foreground">${total.toFixed(2)}</span>
            </div>
          </div>

          {step === "info" && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Customer Info</h3>
                <div>
                  <Label>Full Name *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="mt-1.5" readOnly={!!user} />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="mt-1.5" readOnly={!!user} />
                </div>
              </div>

              {/* Dynamic Payment Methods */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Select Payment Method</h3>
                {methodsLoading ? (
                  <div className="text-center py-6 text-muted-foreground">Loading payment methods…</div>
                ) : paymentMethods.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">No payment methods available. Please contact support.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {paymentMethods.map((pm) => (
                      <button
                        key={pm.id}
                        onClick={() => setSelectedMethod(pm)}
                        className={`p-4 rounded-xl border-2 text-left transition-colors ${
                          selectedMethod?.id === pm.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        } ${pm.type === "placeholder" ? "opacity-70" : ""}`}
                      >
                        <div className="text-lg font-semibold text-foreground mb-1">
                          {pm.icon} {pm.name}
                        </div>
                        <p className="text-xs text-muted-foreground">{pm.description}</p>
                        {pm.custom_note && (
                          <p className="text-xs text-primary font-medium mt-2">{pm.custom_note}</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Placeholder warning */}
              {selectedMethod?.type === "placeholder" && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/50 border border-border">
                  <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Coming Soon</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedMethod.instructions || "This payment method is coming soon. Please contact support or choose another option."}
                    </p>
                  </div>
                </div>
              )}

              <Button
                onClick={() => createOrder()}
                disabled={loading || !selectedMethod || selectedMethod.type === "placeholder"}
                className="w-full gap-2"
                size="lg"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Place Order
              </Button>
            </div>
          )}

          {/* API payment (Cryptomus) */}
          {step === "payment" && selectedMethod?.type === "api" && (
            <div className="text-center space-y-6">
              <CheckCircle className="w-12 h-12 text-primary mx-auto" />
              <h3 className="text-xl font-bold text-foreground">Order Created!</h3>
              {cryptomusUrl ? (
                <>
                  <p className="text-muted-foreground">Click below to complete your crypto payment.</p>
                  <Button asChild size="lg" className="w-full">
                    <a href={cryptomusUrl} target="_blank" rel="noopener noreferrer">
                      Pay with {selectedMethod.name}
                    </a>
                  </Button>
                  <p className="text-xs text-muted-foreground">Your order will be automatically confirmed once payment is received, even if you close this page.</p>
                </>
              ) : (
                <p className="text-muted-foreground">
                  {selectedMethod.name} is not configured yet. Please contact us via WhatsApp or Telegram to complete your payment.
                </p>
              )}
            </div>
          )}

          {/* Manual payment (Binance Pay, etc.) */}
          {step === "payment" && isManualMethod && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground">Send Payment via {selectedMethod!.name}</h3>

              {/* Instructions / Binance specific */}
              {selectedMethod!.slug === "binance" ? (
                <div className="bg-secondary/30 rounded-xl border border-border p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Binance Pay ID</p>
                      <p className="text-xl font-bold font-mono text-foreground">{binancePayId}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(binancePayId); toast.success("Copied!"); }} className="gap-1">
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </Button>
                  </div>
                  <div className="text-center py-4">
                    {binanceQrUrl ? (
                      <div className="inline-block p-3 bg-white rounded-xl">
                        <img src={binanceQrUrl} alt="Binance Pay QR Code" className="mx-auto" style={{ width: 250, height: 250, objectFit: "contain" }} />
                      </div>
                    ) : (
                      <div className="inline-block p-4 bg-secondary/30 rounded-xl">
                        <p className="text-sm text-muted-foreground">QR Code coming soon</p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">Scan with Binance app</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-foreground font-semibold">Amount: ${total.toFixed(2)} USD</p>
                  </div>
                </div>
              ) : selectedMethod!.instructions ? (
                <div className="bg-secondary/30 rounded-xl border border-border p-6">
                  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedMethod!.instructions || '') }} className="text-sm text-foreground prose prose-sm" />
                  <div className="text-center mt-4">
                    <p className="text-sm text-foreground font-semibold">Amount: ${total.toFixed(2)} USD</p>
                  </div>
                </div>
              ) : null}

              {selectedMethod!.custom_note && (
                <p className="text-sm text-primary font-medium text-center">{selectedMethod!.custom_note}</p>
              )}

              {/* Upload Proof */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Upload Payment Proof</h4>
                <p className="text-xs text-muted-foreground">Take a screenshot of your completed transaction and upload it below. Only JPG/PNG, max 5MB.</p>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                >
                  {proofFile ? (
                    <div className="space-y-2">
                      <CheckCircle className="w-8 h-8 text-primary mx-auto" />
                      <p className="text-sm text-foreground font-medium">{proofFile.name}</p>
                      <p className="text-xs text-muted-foreground">{(proofFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">Click to upload screenshot</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={handleFileSelect} />
                <Button onClick={uploadProof} disabled={!proofFile || uploading} className="w-full gap-2" size="lg">
                  {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Submit Payment Proof
                </Button>
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="text-center space-y-6 py-8">
              <CheckCircle className="w-16 h-16 text-primary mx-auto" />
              <h3 className="text-xl font-bold text-foreground">Proof Submitted!</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Our team is verifying your transaction. You will receive an update within 24 hours.
              </p>

              {user ? (
                <div className="flex flex-col gap-3 max-w-xs mx-auto">
                  <Button
                    size="lg"
                    onClick={async () => {
                      if (!orderId) return;
                      try {
                        const { data: orderData } = await supabase
                          .from("orders")
                          .select("*")
                          .eq("id", orderId)
                          .single();
                        const { data: orderItems } = await supabase
                          .from("order_items")
                          .select("product_title, unit_price, quantity")
                          .eq("order_id", orderId);
                        if (orderData && orderItems) {
                          await generateInvoicePDF(orderData as any, orderItems);
                        } else {
                          toast.error("Could not load invoice data.");
                        }
                      } catch {
                        toast.error("Failed to generate invoice.");
                      }
                    }}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" /> Download Your Official Invoice
                  </Button>
                  <Button size="lg" variant="secondary" onClick={() => navigate("/dashboard")}>
                    Go to My Dashboard
                  </Button>
                </div>
              ) : (
                <div className="bg-secondary/40 border border-border rounded-xl p-5 max-w-md mx-auto text-left space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Download Your Official Invoice</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Register or login to your account to download a professional PDF invoice for this order.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="default" onClick={() => navigate("/dashboard")}>
                      Login / Register
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => navigate("/shop")}>
                      Back to Shop
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Checkout;
