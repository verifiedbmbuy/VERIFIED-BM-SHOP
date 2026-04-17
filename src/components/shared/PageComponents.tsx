import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { supabase } from "@/integrations/supabase/client";
import { Star, ExternalLink } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface WorkSample {
  id: string;
  title: string;
  client_name: string | null;
  category: string;
  image_url: string | null;
  link: string | null;
  is_featured: boolean;
}

interface Testimonial {
  id: string;
  client_name: string;
  job_title: string | null;
  rating: number;
  testimonial_text: string;
  avatar_url: string | null;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  faq_group: string;
}

export const WorkSamplesSection = ({ featuredOnly = false }: { featuredOnly?: boolean }) => {
  const [items, setItems] = useState<WorkSample[]>([]);

  useEffect(() => {
    const load = async () => {
      let q = supabase.from("work_samples").select("*").order("sort_order");
      if (featuredOnly) q = q.eq("is_featured", true);
      const { data } = await q;
      setItems(data || []);
    };
    load();
  }, [featuredOnly]);

  if (items.length === 0) return null;

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-foreground text-center mb-10">Our Work</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className="group bg-background rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow">
              {item.image_url && (
                <div className="aspect-video overflow-hidden">
                  <img src={item.image_url} alt={item.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              )}
              <div className="p-5">
                <p className="text-xs font-medium text-primary uppercase tracking-wider mb-1">{item.category}</p>
                <h3 className="text-lg font-semibold text-foreground mb-1">{item.title}</h3>
                {item.client_name && <p className="text-sm text-muted-foreground mb-3">{item.client_name}</p>}
                {item.link && (
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
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

export const TestimonialsSection = () => {
  const [items, setItems] = useState<Testimonial[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("testimonials")
        .select("*")
        .eq("status", "approved")
        .order("sort_order");
      setItems(data || []);
    };
    load();
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-foreground text-center mb-10">What Our Clients Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className="bg-background rounded-xl border border-border p-6">
              <div className="flex gap-0.5 mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className={`w-4 h-4 ${i <= item.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/20"}`} />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mb-4 italic">"{item.testimonial_text}"</p>
              <div className="flex items-center gap-3">
                {item.avatar_url ? (
                  <img src={item.avatar_url} alt={item.client_name} loading="lazy" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {item.client_name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.client_name}</p>
                  {item.job_title && <p className="text-xs text-muted-foreground">{item.job_title}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const FAQsSection = ({ group }: { group?: string }) => {
  const [items, setItems] = useState<FAQ[]>([]);

  useEffect(() => {
    const load = async () => {
      let q = supabase.from("faqs").select("*").order("sort_order");
      if (group) q = q.eq("faq_group", group);
      const { data } = await q;
      setItems(data || []);
    };
    load();
  }, [group]);

  if (items.length === 0) return null;

  return (
    <section className="py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-foreground text-center mb-10">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible className="space-y-3">
          {items.map((item) => (
            <AccordionItem key={item.id} value={item.id} className="bg-background border border-border rounded-lg px-5">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-4">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pb-4" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.answer) }} />
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
