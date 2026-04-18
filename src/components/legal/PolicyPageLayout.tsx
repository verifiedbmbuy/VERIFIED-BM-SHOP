import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Printer, Calendar } from "lucide-react";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import JsonLdSchema from "@/components/seo/JsonLdSchema";
import PageHeader from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";

export interface PolicySection {
  id: string;
  title: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

interface PolicyPageLayoutProps {
  title: string;
  subtitle: string;
  description: string;
  lastUpdated: string;
  sections: PolicySection[];
  breadcrumb: string;
  seoTitle?: string;
  seoDescription?: string;
  slug?: string;
}

const PolicyPageLayout = ({
  title,
  subtitle,
  description,
  lastUpdated,
  sections,
  breadcrumb,
  seoTitle,
  seoDescription,
  slug,
}: PolicyPageLayoutProps) => {
  const [activeSection, setActiveSection] = useState(sections[0]?.id || "");
  const [tocOpen, setTocOpen] = useState(false);
  const [desktopTocPinned, setDesktopTocPinned] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const desktopTocRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  useEffect(() => {
    const updatePinnedState = () => {
      if (window.innerWidth < 768) {
        setDesktopTocPinned(false);
        return;
      }

      const tocAnchor = desktopTocRef.current;
      if (!tocAnchor) return;

      const anchorTop = tocAnchor.getBoundingClientRect().top + window.scrollY;
      setDesktopTocPinned(window.scrollY + 96 >= anchorTop);
    };

    updatePinnedState();
    window.addEventListener("scroll", updatePinnedState, { passive: true });
    window.addEventListener("resize", updatePinnedState);

    return () => {
      window.removeEventListener("scroll", updatePinnedState);
      window.removeEventListener("resize", updatePinnedState);
    };
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setTocOpen(false);
    }
  };

  const handlePrint = () => window.print();

  return (
    <Layout>
      <SEOHead title={seoTitle || title} description={seoDescription || description} />
      <JsonLdSchema
        pageTitle={seoTitle || title}
        pageDescription={seoDescription || description}
        breadcrumbs={[{ name: "Home", url: "/" }, { name: breadcrumb, url: `#` }]}
      />

      <PageHeader
        breadcrumb={breadcrumb}
        title={title}
        subtitle={subtitle}
        description={description}
      />

      {/* Meta bar */}
      <div className="border-b border-border py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-secondary px-3 py-1.5 rounded-full">
            <Calendar className="w-3.5 h-3.5" /> Last Updated: {lastUpdated}
          </span>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 text-xs font-medium bg-secondary px-3 py-1.5 rounded-full hover:bg-accent transition-colors print:hidden"
          >
            <Printer className="w-3.5 h-3.5" /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Body */}
      <section className="py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-10 md:grid md:grid-cols-[16rem_minmax(0,1fr)] md:items-start md:gap-8">
            {/* Sidebar TOC */}
            <aside className="print:hidden md:hidden">
              <button
                onClick={() => setTocOpen(!tocOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-card border border-border rounded-lg mb-3 font-medium text-sm text-foreground"
              >
                Table of Contents
                <ChevronRight className={cn("w-4 h-4 transition-transform", tocOpen && "rotate-90")} />
              </button>
              <nav className={cn(
                "space-y-1",
                !tocOpen && "hidden",
                tocOpen && "mb-6"
              )}>
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className={cn(
                      "w-full flex items-center gap-2 text-left text-sm px-3 py-2.5 rounded-lg transition-colors",
                      activeSection === s.id
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    {s.icon && <span className="shrink-0 w-4 h-4">{s.icon}</span>}
                    <span className="truncate">{s.title}</span>
                  </button>
                ))}
              </nav>
            </aside>

            <div ref={desktopTocRef} className="hidden print:hidden md:block md:w-64">
              <nav
                className={cn(
                  "space-y-1",
                  desktopTocPinned && "md:fixed md:top-24 md:z-10 md:max-h-[calc(100vh-7rem)] md:overflow-y-auto"
                )}
                style={desktopTocPinned ? { width: "16rem" } : undefined}
              >
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className={cn(
                      "w-full flex items-center gap-2 text-left text-sm px-3 py-2.5 rounded-lg transition-colors",
                      activeSection === s.id
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    {s.icon && <span className="shrink-0 w-4 h-4">{s.icon}</span>}
                    <span className="truncate">{s.title}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div ref={contentRef} className="min-w-0 space-y-12">
              {sections.map((s, index) => (
                <div
                  key={s.id}
                  id={s.id}
                  className="scroll-mt-24"
                  style={index > 1 ? { contentVisibility: "auto", containIntrinsicSize: "1px 700px" } : undefined}
                >
                  <div className="flex items-center gap-3 mb-4">
                    {s.icon && (
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        {s.icon}
                      </div>
                    )}
                    <h2 className="text-xl md:text-2xl font-bold text-foreground">{s.title}</h2>
                  </div>
                  <div className="prose prose-sm max-w-none text-muted-foreground [&>p]:mb-4 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-4 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-4 [&>li]:mb-1.5">
                    {s.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PolicyPageLayout;

/* Reusable highlight boxes */
export const InfoBox = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("flex gap-3 p-4 rounded-lg border bg-primary/5 border-primary/20 text-sm text-foreground my-4", className)}>
    {children}
  </div>
);
export const WarningBox = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("flex gap-3 p-4 rounded-lg border bg-destructive/5 border-destructive/20 text-sm text-foreground my-4", className)}>
    {children}
  </div>
);
export const SuccessBox = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("flex gap-3 p-4 rounded-lg border bg-[hsl(142,70%,45%)]/5 border-[hsl(142,70%,45%)]/20 text-sm text-foreground my-4", className)}>
    {children}
  </div>
);
