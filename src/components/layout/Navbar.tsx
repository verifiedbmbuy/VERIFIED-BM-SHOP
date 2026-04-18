import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, User, Menu, X, Search, LogOut } from "lucide-react";
import { useBranding } from "@/hooks/useBranding";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { toBrandedUrl } from "@/lib/imageUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useMenuItems } from "@/hooks/useMenuItems";

const AuthModal = lazy(() => import("@/components/auth/AuthModal"));

const defaultNavLinks = [
  { label: "HOME", path: "/" },
  { label: "SHOP", path: "/shop" },
  { label: "BLOG", path: "/blog" },
  { label: "CONTACT US", path: "/contact" },
  { label: "ABOUT US", path: "/about" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { branding } = useBranding();
  const { user, profile, role, signOut } = useAuth();
  const { openCart, totalItems } = useCart();
  const { data: dbMenuItems } = useMenuItems("header");
  const navLinks = dbMenuItems && dbMenuItems.length > 0
    ? dbMenuItems.map(m => ({ label: m.label.toUpperCase(), path: m.url }))
    : defaultNavLinks;

  // Close mobile menu on route change (state syncing)
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Click-outside listener for mobile menu
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-mobile-menu]") || target.closest("[data-menu-toggle]")) return;
      setMobileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobileOpen]);

  const toggleMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setMobileOpen((prev) => !prev);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const handleAccountClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (user) {
      navigate("/dashboard");
    } else {
      setAuthModalOpen(true);
    }
    setMobileOpen(false);
  }, [user, navigate]);

  const fallbackLogo = "/images/logos/Verified-bm-shop-logo.png";
  const logoSrc = fallbackLogo;

  const logoElement = (
    <img
      src={logoSrc}
      alt={branding.site_title || "Verified BM Shop official logo"}
      width={180}
      height={44}
      loading={location.pathname === "/" ? "eager" : "lazy"}
      decoding="async"
      className="h-11 w-auto max-w-[200px] object-contain"
      onError={(e) => {
        const img = e.currentTarget;
        if (img.src !== fallbackLogo) {
          img.src = fallbackLogo;
        }
      }}
    />
  );

  const userInitial = profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U";
  const displayName = profile?.full_name || user?.email?.split("@")[0] || "User";

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-50 bg-background/95 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.05)]" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center shrink-0" aria-label="Go to homepage">
              {logoElement}
            </Link>

            {/* Mobile/tablet: cart + user icons next to logo */}
            <div className="flex lg:hidden items-center gap-4">
              <button
                onClick={(e) => { e.stopPropagation(); openCart(); }}
                className="relative text-foreground/70 hover:text-primary transition-colors"
                aria-label={`Shopping cart with ${totalItems} items`}
              >
                <ShoppingCart className="w-[18px] h-[18px]" strokeWidth={2.2} />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </button>
              {user ? (
                <button
                  onClick={handleAccountClick}
                  className="text-foreground/70 hover:text-primary transition-colors"
                  aria-label="My Account"
                >
                  {profile?.avatar_url ? (
                    <img src={toBrandedUrl(profile.avatar_url)} alt={displayName} className="w-7 h-7 rounded-full object-cover border border-border" />
                  ) : (
                    <User className="w-[18px] h-[18px]" strokeWidth={2.2} />
                  )}
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setAuthModalOpen(true); }}
                  className="text-foreground/70 hover:text-primary transition-colors"
                  aria-label="Sign in or register"
                >
                  <User className="w-[18px] h-[18px]" strokeWidth={2.2} />
                </button>
              )}
            </div>

            <div className="hidden lg:flex items-center justify-center flex-1 gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  aria-label={`Navigate to ${link.label.toLowerCase()}`}
                  className={`text-[13px] font-semibold tracking-wide whitespace-nowrap transition-colors hover:text-primary ${
                    location.pathname === link.path ? "text-primary" : "text-foreground/80"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-5 min-w-[120px] justify-end">
              <button
                onClick={(e) => { e.stopPropagation(); setSearchOpen(!searchOpen); }}
                className="text-foreground/70 hover:text-primary transition-colors"
                aria-label="Search"
              >
                <Search className="w-[18px] h-[18px]" strokeWidth={2.2} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); openCart(); }}
                className="relative text-foreground/70 hover:text-primary transition-colors"
                aria-label={`Shopping cart with ${totalItems} items`}
              >
                <ShoppingCart className="w-[18px] h-[18px]" strokeWidth={2.2} />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </button>

              {/* User avatar only */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="focus:outline-none" aria-label="User menu">
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={displayName}
                          className="w-8 h-8 rounded-full object-cover border border-border"
                          loading="lazy"
                          width={32}
                          height={32}
                          decoding="async"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                          {userInitial}
                        </div>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                      My Dashboard
                    </DropdownMenuItem>
                    {role === "admin" && (
                      <DropdownMenuItem onClick={() => navigate("/admin")}>
                        Admin Panel
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setAuthModalOpen(true); }}
                  className="text-foreground/70 hover:text-primary transition-colors"
                  aria-label="Sign in or register"
                >
                  <User className="w-[18px] h-[18px]" strokeWidth={2.2} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        {searchOpen && (
          <div className="border-t border-border/50 bg-background px-4 py-3">
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative" role="search">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, blog posts…"
                aria-label="Search products and blog posts"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </form>
          </div>
        )}

      </nav>

      <div className="h-16" aria-hidden="true" />

      {/* Auth Modal */}
      {authModalOpen && (
        <Suspense fallback={null}>
          <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        </Suspense>
      )}
    </>
  );
};

export default Navbar;
