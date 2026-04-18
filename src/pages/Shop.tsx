import { useState } from "react";
import { Helmet } from "react-helmet-async";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import JsonLdSchema from "@/components/seo/JsonLdSchema";
import PageHeader from "@/components/layout/PageHeader";
import ProductCard from "@/components/shared/ProductCard";
import { usePageSEO } from "@/hooks/usePageSEO";
import { usePageContent } from "@/hooks/usePageContent";
import EditableText from "@/components/editor/EditableText";
import { getSiteUrl } from "@/lib/config";
import { PUBLIC_PRODUCTS } from "@/data/publicContent";

const categories = ["All", "Verified BM", "WhatsApp API", "Facebook Accounts", "TikTok Ads", "Reinstated Profiles"];

/** AggregateOffer JSON-LD for shop page — shows price range in Google results */
const AggregateOfferSchema = ({ products }: { products: any[] }) => {
  const inStock = products.filter((p) => p.stock_status === "in_stock");
  if (inStock.length === 0) return null;
  const prices = inStock.map((p) => p.sale_price || p.price);
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Verified BM Shop — Digital Marketing Accounts",
    description: "Premium verified Facebook Business Managers, WhatsApp Business API, and advertising accounts.",
    brand: { "@type": "Brand", name: "Verified BM Shop" },
    url: `${siteUrl}/shop`,
    offers: {
      "@type": "AggregateOffer",
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      priceCurrency: "USD",
      offerCount: inStock.length,
      availability: "https://schema.org/InStock",
    },
  };
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

const Shop = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [products] = useState<any[]>([...PUBLIC_PRODUCTS]);
  const { pageSEO } = usePageSEO("shop");
  const { content } = usePageContent("shop");

  const filtered = products.filter((p) => {
    const matchesCategory = activeCategory === "All" || p.category === activeCategory;
    const matchesSearch = !search || p.title.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <Layout>
      <SEOHead title={pageSEO?.meta_title || pageSEO?.title || "Shop - Verified Accounts"} description={pageSEO?.meta_description || "Browse and buy premium verified Meta accounts, WhatsApp Business API, Facebook Ads accounts. Instant delivery and 7-day replacement guarantee."} />
      <JsonLdSchema
        pageTitle={pageSEO?.meta_title || pageSEO?.title || "Shop - Verified Accounts"}
        pageDescription={pageSEO?.meta_description || "Browse and buy premium verified Meta accounts, WhatsApp Business API, Facebook Ads accounts."}
        breadcrumbs={[{ name: "Home", url: "/" }, { name: "Shop", url: "/shop" }]}
      />
      <AggregateOfferSchema products={products} />
      <PageHeader
        breadcrumb="Shop"
        subtitle={content.header_subtitle || "BROWSE & BUY"}
        title={content.header_title || pageSEO?.title || "Our Products"}
        description={content.header_description || pageSEO?.meta_description || "Premium verified Meta accounts, WhatsApp API access, and more. All with instant delivery and 7-day replacement guarantee."}
        editableKeys={{
          subtitle: "header_subtitle",
          title: "header_title",
          description: "header_description",
        }}
        showSearch
        searchValue={search}
        onSearchChange={setSearch}
      />

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-background border border-border text-foreground hover:bg-accent"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <EditableText
              fieldKey="shop_empty_text"
              value={content.shop_empty_text || ""}
              fallback="No products found."
              as="div"
              className="text-center py-12 text-muted-foreground"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Shop;
