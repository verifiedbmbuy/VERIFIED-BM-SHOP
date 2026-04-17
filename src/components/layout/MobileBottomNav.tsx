import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, ShoppingBag, MessageCircle, User, X, ShoppingCart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useBranding } from "@/hooks/useBranding";
import AuthModal from "@/components/auth/AuthModal";
import ChatMenu from "./ChatMenu";
import { getAdminMediaUrl, toBrandedUrl } from "@/lib/imageUtils";

const navLinks = [
  { label: "HOME", path: "/" },
  { label: "SHOP", path: "/shop" },
  { label: "BLOG", path: "/blog" },
  { label: "CONTACT US", path: "/contact" },
  { label: "ABOUT US", path: "/about" },
];

const MobileBottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { openCart, totalItems } = useCart();
  const { branding } = useBranding();
  const [authOpen, setAuthOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  const baseClasses = "flex-1 flex flex-col items-center justify-center transition-all duration-150 active:scale-110 relative";
  const inactiveClasses = "text-muted-foreground";
  const activeClasses = "text-primary";

  const Dot = () => (
    <span className="absolute top-1.5 w-[6px] h-[6px] rounded-full bg-primary" />
  );

  const logoSrc = branding.header_logo ? toBrandedUrl(branding.header_logo) : getAdminMediaUrl("branding/verified-bm-services-header.png");

  return (
    <>
      <ChatMenu open={chatOpen} onClose={() => setChatOpen(false)} position="mobile" />

      {/* Left-to-right slide sidebar */}
      <div
        className={`fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />
      <div
        className={`fixed top-0 left-0 bottom-0 z-[9999] w-[280px] bg-background border-r border-border lg:hidden transition-transform duration-300 ease-out ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-border">
          <Link to="/" onClick={() => setMenuOpen(false)}>
            <img
              src={logoSrc}
              alt={branding.site_title || "Verified BM Shop"}
              className="h-8 w-auto max-w-[150px] object-contain"
            />
          </Link>
          <button onClick={() => setMenuOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-4 space-y-1 overflow-y-auto max-h-[calc(100vh-64px)]">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 text-sm font-medium transition-colors py-3 px-3 rounded-lg ${
                isActive(link.path)
                  ? "text-primary bg-primary/5"
                  : "text-foreground hover:text-primary hover:bg-muted"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="border-t border-border my-2" />
        </div>
      </div>

      {/* Bottom nav bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex justify-between lg:hidden h-[60px] bg-background border-t border-border shadow-[0_-2px_10px_rgba(0,0,0,0.06)] px-4"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className={`${baseClasses} ${menuOpen ? activeClasses : inactiveClasses}`}
          aria-label="Menu"
        >
          {menuOpen ? <X className="w-6 h-6" strokeWidth={2} /> : <Menu className="w-6 h-6" strokeWidth={2} />}
        </button>

        <Link
          to="/shop"
          className={`${baseClasses} ${isActive("/shop") ? activeClasses : inactiveClasses}`}
          aria-label="Shop"
        >
          {isActive("/shop") && <Dot />}
          <ShoppingBag className="w-6 h-6" strokeWidth={2} />
        </Link>

        <button
          onClick={() => setChatOpen((v) => !v)}
          className={`${baseClasses} text-[hsl(142,70%,49%)]`}
          aria-label="Chat support"
        >
          <MessageCircle className="w-6 h-6" strokeWidth={2} />
        </button>

        {user ? (
          <Link
            to="/dashboard"
            className={`${baseClasses} ${isActive("/dashboard") ? activeClasses : inactiveClasses}`}
            aria-label="My Account"
          >
            {isActive("/dashboard") && <Dot />}
            <User className="w-6 h-6" strokeWidth={2} />
          </Link>
        ) : (
          <button
            onClick={() => setAuthOpen(true)}
            className={`${baseClasses} ${inactiveClasses}`}
            aria-label="My Account"
          >
            <User className="w-6 h-6" strokeWidth={2} />
          </button>
        )}
      </nav>

      <div className="h-[60px] lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }} />

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
};

export default MobileBottomNav;
