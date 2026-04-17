import { Link } from "react-router-dom";
import { Home, ChevronRight } from "lucide-react";

interface PageHeaderProps {
  breadcrumb: string;
  title: string;
  subtitle?: string;
  description?: string;
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
}

const PageHeader = ({
  breadcrumb,
  title,
  subtitle,
  description,
  showSearch,
  searchValue,
  onSearchChange,
}: PageHeaderProps) => {
  return (
    <section className="relative h-[200px] md:h-[200px] lg:h-[220px] flex items-center justify-center text-center overflow-hidden bg-primary">
      <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        {/* Breadcrumbs */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-primary-foreground/80 mb-2">
          <Link to="/" className="flex items-center gap-1 hover:text-primary-foreground">
            <Home className="w-3.5 h-3.5" /> Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-medium text-primary-foreground">{breadcrumb}</span>
        </div>

        {subtitle && (
          <p className="text-xs font-semibold tracking-widest uppercase text-primary-foreground/80 mb-1.5">
            {subtitle}
          </p>
        )}

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-foreground leading-tight">
          {title}
        </h1>

        {description && (
          <p className="text-sm text-primary-foreground/80 max-w-xl mx-auto mt-1.5 leading-snug">
            {description}
          </p>
        )}

        {showSearch && (
          <div className="mt-3 max-w-lg mx-auto">
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search products..."
                value={searchValue || ""}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-primary-foreground text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default PageHeader;
