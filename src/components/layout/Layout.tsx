import { ReactNode, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import AnnouncementBar from "./AnnouncementBar";
import Footer from "./Footer";
import MobileBottomNav from "./MobileBottomNav";
import TrackingScripts from "@/components/tracking/TrackingScripts";
import ScrollToTopButton from "./ScrollToTopButton";
import { useEditMode } from "@/contexts/EditModeContext";

// Defer heavy widgets — not needed for initial paint / LCP
const AIChatWidget = lazy(() => import("@/components/chat/AIChatWidget"));
const NewsletterPopup = lazy(() => import("@/components/newsletter/NewsletterPopup"));
const InstallPrompt = lazy(() => import("@/components/pwa/InstallPrompt"));
const FloatingEditBar = lazy(() => import("@/components/editor/FloatingEditBar"));
const OrderThankYouPopup = lazy(() => import("@/components/layout/OrderThankYouPopup"));

const EDITABLE_SELECTORS = "h1, h2, h3, h4, p, span, li";

const routeToSlug: Record<string, string> = {
  "/": "home",
  "/about": "about",
  "/contact": "contact",
  "/shop": "shop",
};

const Layout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const pathname = location.pathname;
  const { isEditMode, updateField } = useEditMode();
  const mainRef = useRef<HTMLElement>(null);

  let slug = routeToSlug[pathname] || "";
  if (!slug && pathname.startsWith("/page/")) {
    slug = pathname.replace("/page/", "");
  }

  // Generate a stable key for an element based on its position
  const getElementKey = useCallback((el: Element): string => {
    const tag = el.tagName.toLowerCase();
    const text = (el.textContent || "").slice(0, 40).replace(/\s+/g, "_");
    // Walk up to find a section or id for scoping
    let scope = "";
    let parent = el.parentElement;
    while (parent && parent !== document.body) {
      if (parent.id) { scope = parent.id; break; }
      if (parent.getAttribute("data-section")) { scope = parent.getAttribute("data-section")!; break; }
      parent = parent.parentElement;
    }
    return `${slug}_${scope}_${tag}_${text}`;
  }, [slug]);

  // Inject contentEditable on all text elements inside main
  useEffect(() => {
    if (!mainRef.current) return;
    const container = mainRef.current;
    const elements = container.querySelectorAll(EDITABLE_SELECTORS);

    if (isEditMode) {
      elements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        // Skip elements inside the edit bar / toolbar
        if (htmlEl.closest("[data-edit-toolbar]") || htmlEl.closest("[data-floating-bar]")) return;
        // Skip elements that already have their own contentEditable management
        if (htmlEl.dataset.managedEditable) return;
        htmlEl.contentEditable = "true";
        htmlEl.dataset.editableInjected = "true";
        (htmlEl as any).suppressContentEditableWarning = true;
      });
    } else {
      // Clean up
      container.querySelectorAll("[data-editable-injected]").forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.contentEditable = "inherit";
        delete htmlEl.dataset.editableInjected;
      });
    }
  }, [isEditMode, children]);

  // Capture text changes via onInput delegation
  useEffect(() => {
    if (!isEditMode || !mainRef.current) return;
    const container = mainRef.current;

    const handleInput = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.dataset.editableInjected !== "true") return;
      const key = getElementKey(target);
      const newValue = target.innerHTML;
      updateField(key, newValue);
    };

    container.addEventListener("input", handleInput);
    return () => container.removeEventListener("input", handleInput);
  }, [isEditMode, getElementKey, updateField]);

  // Prevent accidental navigation: block links AND buttons
  useEffect(() => {
    if (!isEditMode) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Allow toolbar / edit bar clicks
      if (target.closest("[data-edit-toolbar]") || target.closest("[data-floating-bar]")) return;

      const anchor = target.closest("a");
      const button = target.closest("button");

      if (anchor) {
        const href = anchor.getAttribute("href");
        if (href?.startsWith("http") || href?.startsWith("mailto:") || href?.startsWith("tel:")) return;
        e.preventDefault();
        e.stopPropagation();
      }

      if (button) {
        // Allow edit-bar buttons
        if (button.closest("[data-floating-bar]") || button.closest("[data-edit-toolbar]")) return;
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [isEditMode]);

  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm focus:font-semibold focus:shadow-lg focus:outline-none"
      >
        Skip to content
      </a>
      <AnnouncementBar />
      <Navbar />
      <main ref={mainRef} id="main-content" className="flex-1">{children}</main>
      <Footer />
      <MobileBottomNav />
      <Suspense fallback={null}>
        <AIChatWidget />
        <NewsletterPopup />
        <InstallPrompt />
        <OrderThankYouPopup />
        {slug && <FloatingEditBar slug={slug} />}
      </Suspense>
      <TrackingScripts />
      <ScrollToTopButton />
    </div>
  );
};

export default Layout;
