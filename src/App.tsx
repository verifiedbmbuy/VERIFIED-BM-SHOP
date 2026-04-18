import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route, useParams } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { EditModeProvider } from "@/contexts/EditModeContext";
import MaintenanceGuard from "@/components/MaintenanceGuard";
import { ScrollToTop } from "@/components/ScrollToTop";
import CartDrawer from "@/components/cart/CartDrawer";
import Index from "./pages/Index";

// Lazy-loaded routes — not needed for initial paint
const Shop = lazy(() => import("./pages/Shop"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Contact = lazy(() => import("./pages/Contact"));
const About = lazy(() => import("./pages/About"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Search = lazy(() => import("./pages/Search"));
const NotFound = lazy(() => import("./pages/NotFound"));
const DynamicPage = lazy(() => import("./pages/DynamicPage"));
const Checkout = lazy(() => import("./pages/Checkout"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const ReplacementGuarantee = lazy(() => import("./pages/ReplacementGuarantee"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Dashboard = lazy(() => import("./pages/Dashboard"));

// Admin routes — heavy, rarely visited
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminPosts = lazy(() => import("./pages/admin/AdminPosts"));
const AdminPostEditor = lazy(() => import("./pages/admin/AdminPostEditor"));
const AdminPages = lazy(() => import("./pages/admin/AdminPages"));
const AdminPageEditor = lazy(() => import("./pages/admin/AdminPageEditor"));
const AdminMedia = lazy(() => import("./pages/admin/AdminMedia"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminComments = lazy(() => import("./pages/admin/AdminComments"));
const AdminSubscribers = lazy(() => import("./pages/admin/AdminSubscribers"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminSEO = lazy(() => import("./pages/admin/AdminSEO"));
const AdminWorkSamples = lazy(() => import("./pages/admin/AdminWorkSamples"));
const AdminTestimonials = lazy(() => import("./pages/admin/AdminTestimonials"));
const AdminFAQs = lazy(() => import("./pages/admin/AdminFAQs"));
const AdminMessages = lazy(() => import("./pages/admin/AdminMessages"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers"));
const AdminAuthConfig = lazy(() => import("./pages/admin/AdminAuthConfig"));
const AdminMenus = lazy(() => import("./pages/admin/AdminMenus"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminAssetTracker = lazy(() => import("./pages/admin/AdminAssetTracker"));
const AdminTeamAnalytics = lazy(() => import("./pages/admin/AdminTeamAnalytics"));
const AdminFinancialOverview = lazy(() => import("./pages/admin/AdminFinancialOverview"));
const AdminTaskBoard = lazy(() => import("./pages/admin/AdminTaskBoard"));
const AdminIntegrations = lazy(() => import("./pages/admin/AdminIntegrations"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchOnWindowFocus: true,
    },
  },
});

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const LegacyDynamicPageRedirect = () => {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return <Navigate to="/" replace />;
  return <Navigate to={`/${slug}`} replace />;
};

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollToTop />
        <AuthProvider>
          <CartProvider>
          <EditModeProvider>
          <CartDrawer />
          <MaintenanceGuard>
          <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            <Route path="/product" element={<Navigate to="/shop" replace />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/search" element={<Search />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/replacement-guarantee" element={<ReplacementGuarantee />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="posts" element={<AdminPosts />} />
              <Route path="posts/new" element={<AdminPostEditor />} />
              <Route path="posts/:id/edit" element={<AdminPostEditor />} />
              <Route path="pages" element={<AdminPages />} />
              <Route path="pages/new" element={<AdminPageEditor />} />
              <Route path="pages/:id/edit" element={<AdminPageEditor />} />
              <Route path="media" element={<AdminMedia />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="comments" element={<AdminComments />} />
              <Route path="subscribers" element={<AdminSubscribers />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="seo" element={<AdminSEO />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="work-samples" element={<AdminWorkSamples />} />
              <Route path="testimonials" element={<AdminTestimonials />} />
              <Route path="faqs" element={<AdminFAQs />} />
              <Route path="messages" element={<AdminMessages />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="auth-config" element={<AdminAuthConfig />} />
              <Route path="menus" element={<AdminMenus />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="assets" element={<AdminAssetTracker />} />
              <Route path="team" element={<AdminTeamAnalytics />} />
              <Route path="finance" element={<AdminFinancialOverview />} />
              <Route path="tasks" element={<AdminTaskBoard />} />
              <Route path="integrations" element={<AdminIntegrations />} />
            </Route>
            <Route path="/page/:slug" element={<LegacyDynamicPageRedirect />} />
            <Route path="/page" element={<Navigate to="/" replace />} />
            <Route path="/:slug" element={<DynamicPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          </MaintenanceGuard>
          </EditModeProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
