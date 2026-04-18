import { useState, useEffect, useCallback } from "react";
import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import { useBranding } from "@/hooks/useBranding";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import {
  LayoutDashboard, FileText, File, Image, Settings, Menu, X,
  ChevronDown, ChevronRight, LogOut, Lock, Package, MessageSquare,
  Mail, ShoppingCart, Search, Briefcase, MessageCircle, HelpCircle,
  ExternalLink, RefreshCw, Star, Users, UserCheck, Database, BarChart3, Wallet,
  ClipboardList, Sun, Moon, Plug,
} from "lucide-react";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import NotificationBell from "@/components/admin/NotificationBell";
import { Input } from "@/components/ui/input";

const navItems = [
  { title: "Dashboard", path: "/admin", icon: LayoutDashboard, section: "dashboard" },
  { title: "Messages", path: "/admin/messages", icon: MessageSquare, section: "dashboard" },
  { title: "Posts", path: "/admin/posts", icon: FileText, section: "posts" },
  { title: "Website Content", path: "/admin/pages", icon: File, section: "pages" },
  { title: "Products", path: "/admin/products", icon: Package, section: "dashboard" },
  { title: "Orders", path: "/admin/orders", icon: ShoppingCart, section: "dashboard" },
  { title: "Comments", path: "/admin/comments", icon: MessageCircle, section: "posts", badge: true },
  { title: "Subscribers", path: "/admin/subscribers", icon: Mail, section: "dashboard" },
  { title: "Media", path: "/admin/media", icon: Image, section: "media" },
  { title: "Customers", path: "/admin/customers", icon: UserCheck, section: "users" },
  { title: "Users", path: "/admin/users", icon: Users, section: "users" },
  { title: "Work Samples", path: "/admin/work-samples", icon: Briefcase, section: "dashboard" },
  { title: "Reviews", path: "/admin/reviews", icon: Star, section: "dashboard" },
  { title: "Testimonials", path: "/admin/testimonials", icon: MessageCircle, section: "dashboard" },
  { title: "FAQs", path: "/admin/faqs", icon: HelpCircle, section: "dashboard" },
  { title: "Asset Tracker", path: "/admin/assets", icon: Database, section: "dashboard" },
  { title: "Team Analytics", path: "/admin/team", icon: BarChart3, section: "dashboard" },
  { title: "Financial", path: "/admin/finance", icon: Wallet, section: "finance" },
  { title: "Task Board", path: "/admin/tasks", icon: ClipboardList, section: "dashboard" },
  { title: "Integrations", path: "/admin/integrations", icon: Plug, section: "settings" },
  { title: "Navigation", path: "/admin/menus", icon: Menu, section: "settings" },
  { title: "SEO", path: "/admin/seo", icon: Search, section: "settings" },
  { title: "Auth Config", path: "/admin/auth-config", icon: Lock, section: "settings" },
  { title: "Settings", path: "/admin/settings", icon: Settings, section: "settings" },
];

const AdminLayout = () => {
  const { user, profile, role, loading, signOut, canAccess } = useAuth();
  const { branding } = useBranding();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("admin_dark_mode") === "true";
    return false;
  });
  const location = useLocation();

  // Apply dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("admin_dark_mode", String(darkMode));
  }, [darkMode]);

  const handleSyncSite = useCallback(async () => {
    setSyncing(true);
    try {
      await supabase.from("site_settings").upsert(
        { key: "site_version", value: new Date().toISOString() },
        { onConflict: "key" }
      );
      await queryClient.invalidateQueries();
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith("page_") || k.startsWith("cache_") || k.startsWith("content_"))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      await fetch(window.location.origin, {
        method: "HEAD",
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      }).catch(() => {});
      toast({
        title: "Site Cache Cleared & Data Synced!",
        description: "All caches have been invalidated and data refreshed.",
      });
    } catch {
      toast({
        title: "Sync failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  }, [queryClient]);

  useEffect(() => {
    const fetchPending = async () => {
      const { count } = await supabase
        .from("comments")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      setPendingCount(count || 0);
    };
    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#2271b1] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/admin/login" replace />;

  if (!role) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#2271b1] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (role !== "admin" && role !== "editor") {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
        <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-md text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-sm text-gray-500">
            You don't have permission to access the admin panel.
          </p>
          <p className="text-xs text-gray-400">
            Signed in as: <span className="font-medium">{user.email}</span>
            {role && <> · Role: <span className="font-medium capitalize">{role}</span></>}
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <button onClick={handleSignOut} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors">Sign Out</button>
            <Link to="/" className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">Go to Site</Link>
          </div>
        </div>
      </div>
    );
  }

  const isActive = (path: string) =>
    path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(path);

  const displayName = profile?.full_name || user.email || "Admin";
  const initials = displayName.charAt(0).toUpperCase();

  // Build breadcrumbs
  const currentNav = navItems.find((n) => isActive(n.path));
  const breadcrumbs = [
    { label: "Admin", path: "/admin" },
    ...(currentNav && currentNav.path !== "/admin" ? [{ label: currentNav.title, path: currentNav.path }] : []),
  ];

  // Filter nav items by search
  const filteredNavItems = searchQuery.trim()
    ? navItems.filter((item) => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : navItems;

  const SidebarNav = () => (
    <div className="flex flex-col h-full bg-[#1d2327] text-[#c3c4c7]">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-[#ffffff0d] shrink-0">
        <Link to="/admin" className="flex items-center gap-2 min-w-0">
          <img
            src={branding.header_logo || "/images/logos/Verified-bm-shop-logo.png"}
            alt={branding.site_title || "Admin"}
            className="max-h-[32px] w-auto object-contain brightness-0 invert"
            onError={(e) => { (e.target as HTMLImageElement).src = "/images/logos/Verified-bm-shop-logo.png"; }}
          />
        </Link>
      </div>

      {/* View Site */}
      {sidebarOpen && (
        <a
          href={window.location.origin}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 mx-2 mt-2 mb-1 px-3 py-2 rounded text-xs font-medium text-[#c3c4c7] hover:bg-[#2c3338] hover:text-white transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
          <span>View Site</span>
        </a>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto scrollbar-thin">
        {filteredNavItems.map((item) => {
          const accessible = canAccess(item.section);
          const active = isActive(item.path);

          if (!accessible) {
            return (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-3 px-3 py-2 rounded text-sm text-[#ffffff20] cursor-not-allowed">
                    <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                    {sidebarOpen && (
                      <>
                        <span className="flex-1 text-[13px]">{item.title}</span>
                        <Lock className="w-3 h-3" />
                      </>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">Upgrade permissions</TooltipContent>
              </Tooltip>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded text-[13px] font-medium transition-colors group",
                active
                  ? "bg-[#2271b1] text-white"
                  : "text-[#c3c4c7] hover:bg-[#2c3338] hover:text-white"
              )}
            >
              <item.icon className={cn(
                "w-[18px] h-[18px] flex-shrink-0 transition-colors",
                active ? "text-white" : "text-[#a7aaad] group-hover:text-white"
              )} />
              {sidebarOpen && <span className="flex-1">{item.title}</span>}
              {(item as any).badge && pendingCount > 0 && (
                <span className={cn(
                  "min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center",
                  active ? "bg-white text-[#2271b1]" : "bg-[#d63638] text-white"
                )}>
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 pb-3 space-y-1 border-t border-[#ffffff0d] pt-2 shrink-0">
        {role && sidebarOpen && (
          <div className="px-3 py-1 text-[11px] text-[#8c8f94]">
            Role: <span className="font-medium text-[#c3c4c7] capitalize">{role}</span>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded text-[13px] font-medium text-[#c3c4c7] hover:bg-[#2c3338] hover:text-white transition-colors w-full"
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          {sidebarOpen && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-[#1a1d21] transition-colors duration-300">
      {branding.favicon && (
        <Helmet>
          <link rel="icon" href={branding.favicon} type="image/png" />
          <meta name="robots" content="noindex,nofollow" />
          <meta name="googlebot" content="noindex,nofollow" />
        </Helmet>
      )}

      {!branding.favicon && (
        <Helmet>
          <meta name="robots" content="noindex,nofollow" />
          <meta name="googlebot" content="noindex,nofollow" />
        </Helmet>
      )}

      {/* Desktop Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-40 h-screen bg-[#1d2327] border-r border-[#ffffff0d] transition-all duration-200 hidden md:block",
        sidebarOpen ? "w-56" : "w-[60px]"
      )}>
        <SidebarNav />
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-screen w-56 bg-[#1d2327] border-r border-[#ffffff0d] transition-transform duration-200 md:hidden",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarNav />
      </aside>

      {/* Main Content */}
      <div className={cn("transition-all duration-200", sidebarOpen ? "md:ml-56" : "md:ml-[60px]")}>
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-14 bg-white dark:bg-[#23272b] border-b border-[#dcdcde] dark:border-[#3a3f44] flex items-center justify-between px-4 sm:px-6 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-1.5 rounded text-gray-500 hover:bg-gray-100 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Desktop collapse */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:flex p-1.5 rounded text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumbs */}
            <nav className="hidden sm:flex items-center gap-1 text-sm">
              {breadcrumbs.map((bc, i) => (
                <span key={bc.path} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                  {i === breadcrumbs.length - 1 ? (
                    <span className="font-semibold text-gray-900">{bc.label}</span>
                  ) : (
                    <Link to={bc.path} className="text-[#2271b1] hover:text-[#135e96] font-medium">{bc.label}</Link>
                  )}
                </span>
              ))}
            </nav>

            {/* Mobile title */}
            <h1 className="text-sm font-semibold text-gray-900 sm:hidden">
              {currentNav?.title || "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="hidden lg:block relative">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search admin…"
                className="h-8 w-48 pl-8 text-xs border-gray-300 bg-gray-50 focus:bg-white rounded"
              />
            </div>

            {/* Sync */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleSyncSite}
                  disabled={syncing}
                  className="p-1.5 rounded text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
                </button>
              </TooltipTrigger>
              <TooltipContent>{syncing ? "Syncing..." : "Clear Cache & Sync"}</TooltipContent>
            </Tooltip>

            <NotificationBell />

            {/* Dark Mode Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-1.5 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300"
                >
                  {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>{darkMode ? "Light Mode" : "Dark Mode"}</TooltipContent>
            </Tooltip>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#2271b1] flex items-center justify-center text-white text-xs font-bold">
                  {initials}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                  {displayName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{displayName}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-[#2271b1]/10 text-[#2271b1]">
                        {role}
                      </span>
                    </div>
                    {canAccess("settings") && (
                      <Link
                        to="/admin/settings"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="w-4 h-4" /> Settings
                      </Link>
                    )}
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={() => { setProfileOpen(false); handleSignOut(); }}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition-colors w-full"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
