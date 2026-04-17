import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBranding } from "@/hooks/useBranding";
import { generateInvoicePDF } from "@/lib/invoiceGenerator";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toBrandedUrl } from "@/lib/imageUtils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutDashboard,
  ShoppingBag,
  Download,
  UserCog,
  MessageCircle,
  LogOut,
  Menu,
  X,
  Package,
  FileText,
  Send,
  HelpCircle,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Tab = "overview" | "orders" | "downloads" | "profile" | "support";

const TABS: { key: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "orders", label: "My Orders", icon: ShoppingBag },
  { key: "downloads", label: "Downloads", icon: Download },
  { key: "profile", label: "My Profile", icon: UserCog },
  { key: "support", label: "Support", icon: MessageCircle },
];

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle; className: string }> = {
  completed: { label: "Completed", icon: CheckCircle, className: "bg-primary/10 text-primary border-primary/20" },
  pending: { label: "Pending", icon: Clock, className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  processing: { label: "Processing", icon: AlertCircle, className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  failed: { label: "Failed", icon: XCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
  cancelled: { label: "Cancelled", icon: XCircle, className: "bg-muted text-muted-foreground border-border" },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { branding } = useBranding();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, any[]>>({});
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Profile edit
  const [editName, setEditName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (profile) setEditName(profile.full_name || "");
  }, [profile]);

  // Fetch orders by email
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.email) return;
      setLoadingOrders(true);
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_email", user.email)
        .order("created_at", { ascending: false });
      const orderList = data || [];
      setOrders(orderList);

      // Fetch items for all orders with product slugs
      if (orderList.length > 0) {
        const ids = orderList.map((o) => o.id);
        const { data: items } = await supabase
          .from("order_items")
          .select("*, products(slug)")
          .in("order_id", ids);
        const grouped: Record<string, any[]> = {};
        (items || []).forEach((item) => {
          if (!grouped[item.order_id]) grouped[item.order_id] = [];
          grouped[item.order_id].push(item);
        });
        setOrderItems(grouped);
      }
      setLoadingOrders(false);
    };
    if (user) fetchOrders();
  }, [user]);

  const stats = useMemo(() => {
    const total = orders.length;
    const active = orders.filter((o) => o.status === "completed").length;
    const pending = orders.filter((o) => o.status === "pending" || o.status === "processing").length;
    return { total, active, pending };
  }, [orders]);

  const recentOrders = orders.slice(0, 5);

  const handleUpdateProfile = async () => {
    if (!editName.trim()) { toast.error("Name cannot be empty."); return; }
    setSaving(true);
    await supabase.from("profiles").update({ full_name: editName.trim() }).eq("id", user!.id);
    toast.success("Profile updated!");
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match."); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) { toast.error(error.message); } else {
      toast.success("Password changed successfully!");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleDownloadInvoice = async (order: any) => {
    const items = orderItems[order.id] || [];
    await generateInvoicePDF(order, items);
  };

  if (authLoading) {
    return <Layout><div className="py-24 text-center text-muted-foreground">Loading...</div></Layout>;
  }
  if (!user) return null;

  const displayName = profile?.full_name || user.email?.split("@")[0] || "User";
  const userInitial = displayName.charAt(0).toUpperCase();

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab stats={stats} recentOrders={recentOrders} orderItems={orderItems} loadingOrders={loadingOrders} onViewInvoice={handleDownloadInvoice} />;
      case "orders":
        return <OrdersTab orders={orders} orderItems={orderItems} loading={loadingOrders} onViewInvoice={handleDownloadInvoice} />;
      case "downloads":
        return <DownloadsTab orders={orders.filter((o) => o.status === "completed")} />;
      case "profile":
        return (
          <ProfileTab
            user={user}
            editName={editName}
            setEditName={setEditName}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            showPw={showPw}
            setShowPw={setShowPw}
            saving={saving}
            onUpdateProfile={handleUpdateProfile}
            onChangePassword={handleChangePassword}
          />
        );
      case "support":
        return <SupportTab />;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <SEOHead title="My Dashboard" description="Manage your account, orders, and profile." noIndex />
      <div className="min-h-screen bg-secondary/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-64 min-h-[calc(100vh-4rem)] bg-background border-r border-border p-4 shrink-0">
              <SidebarContent
                user={user}
                profile={profile}
                displayName={displayName}
                userInitial={userInitial}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onSignOut={signOut}
              />
            </aside>

            {/* Mobile Sidebar */}
            {sidebarOpen && (
              <>
                <div className="fixed inset-0 z-40 bg-foreground/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
                <aside className="fixed left-0 top-0 z-50 h-full w-72 bg-background border-r border-border p-4 lg:hidden overflow-y-auto animate-in slide-in-from-left duration-200">
                  <div className="flex justify-end mb-2">
                    <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-accent text-muted-foreground">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <SidebarContent
                    user={user}
                    profile={profile}
                    displayName={displayName}
                    userInitial={userInitial}
                    activeTab={activeTab}
                    setActiveTab={(t) => { setActiveTab(t); setSidebarOpen(false); }}
                    onSignOut={signOut}
                  />
                </aside>
              </>
            )}

            {/* Main Content */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
              {/* Mobile header */}
              <div className="lg:hidden flex items-center gap-3 mb-6">
                <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg border border-border hover:bg-accent">
                  <Menu className="w-5 h-5" />
                </button>
                <h1 className="text-lg font-bold text-foreground">
                  {TABS.find((t) => t.key === activeTab)?.label}
                </h1>
              </div>

              {/* Mobile tab bar */}
              <div className="lg:hidden flex gap-1 overflow-x-auto pb-4 mb-4 -mx-4 px-4 scrollbar-hide">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0",
                      activeTab === tab.key
                        ? "bg-primary text-primary-foreground"
                        : "bg-background border border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {renderContent()}
            </main>
          </div>
        </div>
      </div>
    </Layout>
  );
};

/* ─── Sidebar Content ─── */
const SidebarContent = ({
  user, profile, displayName, userInitial, activeTab, setActiveTab, onSignOut,
}: {
  user: any; profile: any; displayName: string; userInitial: string;
  activeTab: Tab; setActiveTab: (t: Tab) => void; onSignOut: () => void;
}) => (
  <div className="flex flex-col h-full">
    {/* Profile Card */}
    <div className="p-4 rounded-xl bg-secondary/60 border border-border mb-6">
      <div className="flex items-center gap-3">
        {profile?.avatar_url ? (
          <img src={toBrandedUrl(profile.avatar_url)} alt={displayName} className="w-11 h-11 rounded-full object-cover border border-border" />
        ) : (
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
            {userInitial}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">{displayName}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
      </div>
      <Badge variant="outline" className="mt-3 text-xs bg-primary/5 text-primary border-primary/20">
        <CheckCircle className="w-3 h-3 mr-1" /> Verified Buyer
      </Badge>
    </div>

    {/* Navigation */}
    <nav className="space-y-1 flex-1">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            activeTab === tab.key
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          <tab.icon className="w-4 h-4" />
          {tab.label}
        </button>
      ))}
    </nav>

    <button
      onClick={onSignOut}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors mt-4"
    >
      <LogOut className="w-4 h-4" /> Sign Out
    </button>
  </div>
);

/* ─── Overview Tab ─── */
const OverviewTab = ({
  stats, recentOrders, orderItems, loadingOrders, onViewInvoice,
}: {
  stats: { total: number; active: number; pending: number };
  recentOrders: any[];
  orderItems: Record<string, any[]>;
  loadingOrders: boolean;
  onViewInvoice: (o: any) => void;
}) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-foreground">Welcome back!</h2>
      <p className="text-sm text-muted-foreground mt-1">Here's what's happening with your account.</p>
    </div>

    {/* Stat Cards */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: "Total Orders", value: stats.total, icon: Package },
        { label: "Completed", value: stats.active, icon: CheckCircle },
        { label: "Pending", value: stats.pending, icon: Clock },
        { label: "Reward Points", value: stats.total * 10, icon: AlertCircle },
      ].map((s) => (
        <div key={s.label} className="bg-background rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <s.icon className="w-5 h-5 text-primary" />
          </div>
          {loadingOrders ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
        </div>
      ))}
    </div>

    {/* Recent Orders */}
    <div className="bg-background rounded-xl border border-border overflow-hidden">
      <div className="p-5 border-b border-border">
        <h3 className="font-semibold text-foreground">Recent Orders</h3>
      </div>
      {loadingOrders ? (
        <div className="p-5 space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : recentOrders.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground text-sm">No orders yet.</div>
      ) : (
        <div className="divide-y divide-border">
          {recentOrders.map((order) => {
            const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const items = orderItems[order.id] || [];
            return (
              <div key={order.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {items.length > 0 ? items.map((i, idx) => {
                      const slug = i.products?.slug;
                      return slug ? (
                        <Link key={idx} to={`/product/${slug}`} className="text-primary hover:underline">
                          {i.product_title}
                        </Link>
                      ) : i.product_title;
                    }).reduce((prev: any, curr: any, idx: number) => idx === 0 ? [curr] : [...prev, ", ", curr], []) : `Order #${order.id.slice(0, 8)}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant="outline" className={cn("text-xs gap-1", sc.className)}>
                    <sc.icon className="w-3 h-3" /> {sc.label}
                  </Badge>
                  <span className="text-sm font-semibold text-foreground">${order.total_amount}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  </div>
);

/* ─── Orders Tab ─── */
const OrdersTab = ({
  orders, orderItems, loading, onViewInvoice,
}: {
  orders: any[];
  orderItems: Record<string, any[]>;
  loading: boolean;
  onViewInvoice: (o: any) => void;
}) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-foreground">Order History</h2>
    {loading ? (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
      </div>
    ) : orders.length === 0 ? (
      <div className="bg-background rounded-xl border border-border p-12 text-center">
        <ShoppingBag className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-muted-foreground">You haven't placed any orders yet.</p>
      </div>
    ) : (
      <div className="space-y-3">
        {orders.map((order) => {
          const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
          const items = orderItems[order.id] || [];
          return (
            <div key={order.id} className="bg-background rounded-xl border border-border p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="text-xs text-muted-foreground font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
                  <div className="text-sm font-medium text-foreground mt-1">
                    {items.length > 0 ? items.map((i, idx) => {
                      const slug = i.products?.slug;
                      return (
                        <span key={idx}>
                          {idx > 0 && ", "}
                          {slug ? (
                            <Link to={`/product/${slug}`} className="text-primary hover:underline">
                              {i.product_title}
                            </Link>
                          ) : i.product_title}
                        </span>
                      );
                    }) : "Order"}
                  </div>
                  {/* Write a Review button for completed orders */}
                  {order.status === "completed" && items.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {items.map((i, idx) => {
                        const slug = i.products?.slug;
                        if (!slug) return null;
                        return (
                          <Link
                            key={idx}
                            to={`/product/${slug}#reviews`}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                          >
                            <Star className="w-3 h-3" /> Write a Review
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
                <Badge variant="outline" className={cn("text-xs gap-1 shrink-0", sc.className)}>
                  <sc.icon className="w-3 h-3" /> {sc.label}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  <span>{order.payment_method.replace(/_/g, " ")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-foreground">${order.total_amount}</span>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={() => onViewInvoice(order)}>
                    <FileText className="w-3.5 h-3.5" /> Invoice
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);

/* ─── Downloads Tab ─── */
const DownloadsTab = ({ orders }: { orders: any[] }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-foreground">Downloads</h2>
    {orders.length === 0 ? (
      <div className="bg-background rounded-xl border border-border p-12 text-center">
        <Download className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-muted-foreground">No downloads available yet.</p>
        <p className="text-xs text-muted-foreground mt-1">Completed orders with digital products will appear here.</p>
      </div>
    ) : (
      <div className="bg-background rounded-xl border border-border p-5">
        <p className="text-sm text-muted-foreground">
          You have {orders.length} completed order{orders.length !== 1 ? "s" : ""}. API keys and documents will be delivered via email or Telegram.
        </p>
      </div>
    )}
  </div>
);

/* ─── Profile Tab ─── */
const ProfileTab = ({
  user, editName, setEditName, newPassword, setNewPassword,
  confirmPassword, setConfirmPassword, showPw, setShowPw,
  saving, onUpdateProfile, onChangePassword,
}: {
  user: any; editName: string; setEditName: (v: string) => void;
  newPassword: string; setNewPassword: (v: string) => void;
  confirmPassword: string; setConfirmPassword: (v: string) => void;
  showPw: boolean; setShowPw: (v: boolean) => void;
  saving: boolean;
  onUpdateProfile: () => void;
  onChangePassword: () => void;
}) => (
  <div className="space-y-6 max-w-lg">
    <h2 className="text-2xl font-bold text-foreground">My Profile</h2>

    {/* Display Name */}
    <div className="bg-background rounded-xl border border-border p-5 space-y-4">
      <h3 className="font-semibold text-foreground">Display Name</h3>
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
        <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
        <Input value={user.email || ""} disabled className="bg-secondary" />
        <p className="text-xs text-muted-foreground mt-1">Email cannot be changed.</p>
      </div>
      <Button onClick={onUpdateProfile} disabled={saving} className="gap-2">
        {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Changes
      </Button>
    </div>

    {/* Change Password */}
    <div className="bg-background rounded-xl border border-border p-5 space-y-4">
      <h3 className="font-semibold text-foreground">Change Password</h3>
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">New Password</label>
        <div className="relative">
          <Input
            type={showPw ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min. 6 characters"
            className="pr-10"
          />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Confirm Password</label>
        <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
      </div>
      <Button onClick={onChangePassword} disabled={saving || !newPassword} variant="outline" className="gap-2">
        {saving && <Loader2 className="w-4 h-4 animate-spin" />} Update Password
      </Button>
    </div>
  </div>
);

/* ─── Support Tab ─── */
const SupportTab = () => (
  <div className="space-y-6 max-w-lg">
    <h2 className="text-2xl font-bold text-foreground">Support</h2>

    <div className="bg-background rounded-xl border border-border p-6 space-y-4">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
        <MessageCircle className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">Quick Support</h3>
      <p className="text-sm text-muted-foreground">
        Need help with an order or have a question? Our team is available 24/7 on Telegram for instant support.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild className="gap-2">
          <a href="https://t.me/Verifiedbmbuy" target="_blank" rel="noopener noreferrer">
            <Send className="w-4 h-4" /> Chat on Telegram
          </a>
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <Link to="/faq">
            <HelpCircle className="w-4 h-4" /> View FAQ
          </Link>
        </Button>
      </div>
    </div>

    <div className="bg-background rounded-xl border border-border p-6">
      <h3 className="font-semibold text-foreground mb-2">Business Hours</h3>
      <p className="text-sm text-muted-foreground">
        We respond to all inquiries within 1 hour during business hours (9 AM – 11 PM GMT+6).
        For urgent issues, message us directly on Telegram.
      </p>
    </div>
  </div>
);

export default Dashboard;
