import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import PageHeader from "@/components/layout/PageHeader";
import EditableText from "@/components/editor/EditableText";
import { useEditMode } from "@/contexts/EditModeContext";
import { WorkSamplesSection, TestimonialsSection, FAQsSection } from "@/components/shared/PageComponents";
import { Loader2 } from "lucide-react";
import NotFound from "./NotFound";

interface PageData {
  title: string;
  slug: string;
  content: string | null;
  meta_title: string | null;
  meta_description: string | null;
  components: Record<string, boolean>;
  hero_image: string | null;
  hero_overlay: number;
}

const DynamicPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { isEditMode } = useEditMode();

  const { data: page, isLoading, isError } = useQuery({
    queryKey: ["dynamic-page", slug],
    queryFn: async () => {
      if (!slug) throw new Error("No slug");
      const { data, error } = await supabase
        .from("pages")
        .select("title, slug, content, meta_title, meta_description, components, hero_image, hero_overlay")
        .eq("slug", slug)
        .eq("status", "published")
        .single();
      if (error || !data) throw new Error("Not found");
      return {
        ...data,
        components: (data.components as Record<string, boolean>) || {},
        hero_image: data.hero_image || null,
        hero_overlay: data.hero_overlay ?? 50,
      } as PageData;
    },
    enabled: !!slug,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (isError || !page) return <NotFound />;

  let content: Record<string, string> = {};
  try {
    content = page.content ? JSON.parse(page.content) : {};
  } catch {
    content = {};
  }

  return (
    <Layout>
      <SEOHead
        title={page.meta_title || page.title}
        description={page.meta_description || content.page_description || ""}
      />
      <PageHeader
        breadcrumb={page.title}
        subtitle={page.title.toUpperCase()}
        title={content.page_title || page.title}
        description={content.page_description || ""}
      />

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {(content.page_title || page.title) && (
            <EditableText
              fieldKey="page_title"
              value={content.page_title || page.title}
              as="h1"
              className="text-3xl font-bold text-foreground text-center"
            />
          )}

          {content.page_description && (
            <EditableText
              fieldKey="page_description"
              value={content.page_description}
              as="p"
              className="text-lg text-muted-foreground text-center"
            />
          )}

          {content.body_content && (
            <EditableText
              fieldKey="body_content"
              value={content.body_content}
              as="div"
              className="prose prose-sm max-w-none text-muted-foreground"
              richText
            />
          )}

          {Object.entries(content)
            .filter(([k]) => !["page_title", "page_description", "body_content"].includes(k))
            .map(([key, value]) => (
              <EditableText
                key={key}
                fieldKey={key}
                value={value}
                as="div"
                className="prose prose-sm max-w-none text-muted-foreground"
                richText
              />
            ))}
        </div>
      </section>

      {page.components.work_samples && <WorkSamplesSection />}
      {page.components.testimonials && <TestimonialsSection />}
      {page.components.faqs && <FAQsSection />}
    </Layout>
  );
};

export default DynamicPage;
