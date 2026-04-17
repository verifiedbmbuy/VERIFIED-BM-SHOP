import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import JsonLdSchema from "@/components/seo/JsonLdSchema";
import PageHeader from "@/components/layout/PageHeader";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, Calendar, Printer, HelpCircle, MessageCircle, Send, ShoppingCart, Shield, CreditCard, Headphones } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { usePageSEO } from "@/hooks/usePageSEO";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  faq_group: string;
}

const groupIcons: Record<string, React.ReactNode> = {
  General: <HelpCircle className="w-5 h-5" />,
  Products: <ShoppingCart className="w-5 h-5" />,
  Payments: <CreditCard className="w-5 h-5" />,
  Guarantee: <Shield className="w-5 h-5" />,
  Support: <Headphones className="w-5 h-5" />,
};

const FAQ = () => {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const { pageSEO } = usePageSEO("faq");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("faqs").select("*").order("sort_order", { ascending: true });
      setFaqs(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const groups = [...new Set(faqs.map((f) => f.faq_group))];
  const filtered = faqs.filter((f) => {
    const matchSearch = !search || f.question.toLowerCase().includes(search.toLowerCase()) || f.answer.toLowerCase().includes(search.toLowerCase());
    const matchGroup = !activeGroup || f.faq_group === activeGroup;
    return matchSearch && matchGroup;
  });
  const faqsByGroup: Record<string, FaqItem[]> = {};
  filtered.forEach((f) => {
    if (!faqsByGroup[f.faq_group]) faqsByGroup[f.faq_group] = [];
    faqsByGroup[f.faq_group].push(f);
  });

  return (
    <Layout>
       <SEOHead title={pageSEO?.meta_title || pageSEO?.title || "FAQ - Frequently Asked Questions"} description={pageSEO?.meta_description || "Find answers to common questions about Verified BM Shop' products, payments, delivery, and support."} />
      <JsonLdSchema
        pageTitle={pageSEO?.meta_title || pageSEO?.title || "FAQ - Frequently Asked Questions"}
        pageDescription={pageSEO?.meta_description || "Find answers to common questions about Verified BM Shop."}
        faqs={filtered.map((f) => ({ question: f.question, answer: f.answer }))}
        breadcrumbs={[{ name: "Home", url: "/" }, { name: "FAQ", url: "/faq" }]}
      />

      <PageHeader
        breadcrumb="FAQ"
        title={pageSEO?.title || "Frequently Asked Questions"}
        subtitle="HELP CENTER"
        description={pageSEO?.meta_description || "Find quick answers to common questions about our products, payments, and support."}
      />

      {/* Search & Meta bar */}
      <section className="border-b border-border py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search questions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-secondary px-3 py-1.5 rounded-full">
                <Calendar className="w-3.5 h-3.5" /> Last Updated: February 15, 2026
              </span>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-secondary px-3 py-1.5 rounded-full hover:bg-accent transition-colors print:hidden"
              >
                <Printer className="w-3.5 h-3.5" /> Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="py-6 md:py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Group filters */}
          {groups.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-6 print:hidden">
              <button
                onClick={() => setActiveGroup(null)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                  !activeGroup ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-accent"
                )}
              >
                All
              </button>
              {groups.map((g) => (
                <button
                  key={g}
                  onClick={() => setActiveGroup(activeGroup === g ? null : g)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                    activeGroup === g ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-accent"
                  )}
                >
                  {groupIcons[g] || <HelpCircle className="w-4 h-4" />}
                  {g}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <p className="text-center text-muted-foreground py-12">Loading FAQs...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No matching questions found. Try a different search term.</p>
          ) : (
            <div className="space-y-6">
              {Object.entries(faqsByGroup).map(([group, items]) => (
                <div key={group}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      {groupIcons[group] || <HelpCircle className="w-4 h-4" />}
                    </div>
                    <h2 className="text-base font-bold text-foreground">{group}</h2>
                    <span className="text-xs text-muted-foreground">({items.length})</span>
                  </div>
                  <Accordion type="single" collapsible className="space-y-1">
                    {items.map((faq) => (
                      <AccordionItem key={faq.id} value={faq.id} className="bg-card border border-border rounded-lg px-4">
                        <AccordionTrigger className="text-left font-semibold text-foreground py-2.5 text-sm">
                          <span className="line-clamp-1 md:line-clamp-1">{faq.question}</span>
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground text-sm pb-2.5">{faq.answer}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>
          )}
          {/* Still need help CTA */}
          <div className="mt-16 bg-card border border-border rounded-2xl p-8 md:p-12 text-center">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Headphones className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Still Need Help?</h2>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">Can't find what you're looking for? Our support team is available 24/7 to assist you.</p>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <a href="https://wa.me/8801302669333" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[hsl(142,70%,45%)] text-primary-foreground font-medium hover:opacity-90 transition-opacity">
                <MessageCircle className="w-5 h-5" /> Chat on WhatsApp
              </a>
              <a href="https://t.me/Verifiedbmbuy" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[hsl(200,100%,40%)] text-primary-foreground font-medium hover:opacity-90 transition-opacity">
                <Send className="w-5 h-5" /> Message on Telegram
              </a>
              <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default FAQ;
