import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toBrandedUrl } from "@/lib/imageUtils";

const fallback = [
  { id: "1", client_name: "Digital Marketing Agency, USA", title: "Agency BM Setup – 10 Ad Accounts", category: "Advertising", image_url: null, link: null, is_featured: true },
  { id: "2", client_name: "Online Retail Store, UK", title: "WhatsApp API Integration – E-commerce", category: "E-Commerce", image_url: null, link: null, is_featured: true },
  { id: "3", client_name: "Social Media Manager, Germany", title: "Reinstated Profile Recovery", category: "Social Media", image_url: null, link: null, is_featured: true },
];

const PortfolioSection = () => {
  const { data: items, isLoading } = useQuery({
    queryKey: ["work-samples-home"],
    queryFn: async () => {
      const { data } = await supabase
        .from("work_samples")
        .select("*")
        .order("sort_order");
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const display = isLoading ? [] : (items && items.length > 0 ? items : fallback);

  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold tracking-widest uppercase text-primary text-center">Portfolio</p>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mt-2">Our Work Samples</h2>
        <p className="text-muted-foreground text-center mt-4">Real results from real clients. Here's a glimpse of the work we've done for advertisers worldwide.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-6 space-y-3">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))
            : display.map((p) => (
                <div key={p.id} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                  {p.image_url && (
                    <div className="aspect-video overflow-hidden">
                      <img src={toBrandedUrl(p.image_url)} alt={p.title} loading="lazy" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-6">
                    <p className="text-xs text-primary font-medium">{p.client_name || p.category}</p>
                    <h3 className="font-bold text-foreground mt-2">{p.title}</h3>
                    {p.link && (
                      <a href={p.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2">
                        View Project <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
};

export default PortfolioSection;
