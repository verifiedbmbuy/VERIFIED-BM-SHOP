import { useLocation } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <Layout>
      <SEOHead title="Page Not Found" noIndex />
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center px-4">
          <h1 className="mb-4 text-6xl font-bold text-foreground">404</h1>
          <p className="mb-6 text-xl text-muted-foreground">Oops! The page you're looking for doesn't exist.</p>
          <Link to="/" className="inline-flex px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
            Return to Home
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
