import { useMemo, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import DOMPurify from "dompurify";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import JsonLdSchema from "@/components/seo/JsonLdSchema";
import BlogScrollProgress from "@/components/blog/BlogScrollProgress";
import BlogTableOfContents from "@/components/blog/BlogTableOfContents";
import { toBrandedUrl } from "@/lib/imageUtils";
import FeaturedProductWidget from "@/components/blog/FeaturedProductWidget";
import QuickSummaryBox from "@/components/blog/QuickSummaryBox";
import BlogFAQAccordion from "@/components/blog/BlogFAQAccordion";
import AboutAuthorCard from "@/components/blog/AboutAuthorCard";
import SocialShareButtons from "@/components/shared/SocialShareButtons";
import { PUBLIC_BLOG_POSTS } from "@/data/publicContent";
import { ArrowLeft, Clock, CalendarDays, User } from "lucide-react";

/** Try to extract FAQ items from the HTML content (from AI-generated posts) */
function extractFaqs(html: string): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const faqItems = doc.querySelectorAll(".faq-item");
  faqItems.forEach((item) => {
    const q = item.querySelector("h3, strong")?.textContent?.trim();
    const a = item.querySelector("p")?.textContent?.trim();
    if (q && a) faqs.push({ question: q, answer: a });
  });
  return faqs;
}

/** Slugify text for heading IDs */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/** Add IDs to heading tags for anchor linking */
function addHeadingIds(html: string): string {
  let counter = 0;
  return html.replace(/<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi, (match, tag, attrs, content) => {
    if (attrs.includes("id=")) return match;
    counter++;
    // Create slug from text content (strip HTML tags)
    const textContent = content.replace(/<[^>]*>/g, "").trim();
    const slug = slugify(textContent) || `heading-${counter}`;
    return `<${tag}${attrs} id="${slug}">${content}</${tag}>`;
  });
}

const BlogPost = () => {
  const { slug } = useParams();
  const contentRef = useRef<HTMLDivElement>(null);
  const post = useMemo(() => PUBLIC_BLOG_POSTS.find((item) => item.slug === slug) || null, [slug]);

  const sanitizedContent = useMemo(() => {
    if (!post) return "";
    const raw = post.content || post.excerpt || "";
    return DOMPurify.sanitize(raw);
  }, [post]);

  // Add slugified IDs to headings and fix in-content TOC links after DOM render
  const applyHeadingIds = useCallback(() => {
    const container = contentRef.current;
    if (!container) return;

    // 1. Add slugified IDs to all headings
    const headings = container.querySelectorAll("h2, h3");
    const headingMap: { index: number; id: string; text: string }[] = [];
    headings.forEach((el, i) => {
      const text = (el.textContent || "").trim();
      const id = slugify(text) || `heading-${i}`;
      el.id = id;
      headingMap.push({ index: i, id, text });
    });

    // 2. Fix all internal hash links to point to actual heading IDs + add smooth scroll
    const hashLinks = container.querySelectorAll('a[href^="#"]');
    hashLinks.forEach((link) => {
      const linkText = (link.textContent || "").trim();
      const match = headingMap.find(
        (h) => h.text.toLowerCase() === linkText.toLowerCase()
      );
      if (match) {
        link.setAttribute("href", `#${match.id}`);
      }
      link.addEventListener("click", (e) => {
        const href = link.getAttribute("href");
        if (href?.startsWith("#")) {
          e.preventDefault();
          const target = document.getElementById(href.slice(1));
          target?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }, []);

  useEffect(() => {
    if (!sanitizedContent) return;
    const timer = setTimeout(applyHeadingIds, 50);
    return () => clearTimeout(timer);
  }, [sanitizedContent, applyHeadingIds]);

  const faqs = useMemo(() => {
    if (!post?.content) return [];
    return extractFaqs(post.content);
  }, [post]);

  const featuredImage = useMemo(() => {
    if (!post?.featured_image) return null;
    return toBrandedUrl(post.featured_image);
  }, [post]);

  if (!post)
    return (
      <Layout>
        <div className="py-24 text-center text-muted-foreground">Post not found.</div>
      </Layout>
    );

  return (
    <Layout>
      <BlogScrollProgress />
      <JsonLdSchema
        pageTitle={post.meta_title || post.title}
        pageDescription={post.meta_description || post.excerpt || ""}
        pageImage={featuredImage || undefined}
        datePublished={post.published_at}
        dateModified={post.created_at}
        article={post}
        faqs={faqs.length > 0 ? faqs : undefined}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Blog", url: "/blog" },
          { name: post.title, url: `/blog/${post.slug}` },
        ]}
      />
      <SEOHead
        title={post.meta_title || post.title}
        description={post.meta_description || post.excerpt || `Read ${post.title} on Verified BM Shop blog.`}
        ogImage={featuredImage || undefined}
        ogType="article"
        keywords={post.focus_keyword || undefined}
      />

      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-14 md:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>
          {post.category && (
            <span className="inline-block px-3 py-1 bg-primary-foreground/15 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
              {post.category}
            </span>
          )}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight max-w-3xl">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-5 text-primary-foreground/70 text-sm">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" /> {post.author || "Verified BM Shop"}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4" />
              {new Date(post.published_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            {post.read_time && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> {post.read_time}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Content area: two-column on desktop */}
      <section className="py-10 md:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Main content — 75% */}
            <article className="flex-1 lg:max-w-[75%] min-w-0">
              {featuredImage && (
                <img
                  src={toBrandedUrl(featuredImage)}
                  alt={post.title}
                  className="w-full rounded-xl mb-8 aspect-[16/9] object-cover"
                  loading="lazy"
                  width={1200}
                  height={675}
                  decoding="async"
                />
              )}

              {/* Quick Summary */}
              <QuickSummaryBox excerpt={post.excerpt || post.meta_description || ""} />

              {/* Blog body */}
              <div
                ref={contentRef}
                className="blog-content-area prose prose-lg max-w-none text-foreground"
                style={{ fontSize: "18px", lineHeight: 1.6 }}
                dangerouslySetInnerHTML={{ __html: sanitizedContent }}
              />

              {/* FAQ Accordion */}
              <BlogFAQAccordion faqs={faqs} />

              {/* Social Share */}
              <div className="mt-10 pt-6 border-t border-border">
                <SocialShareButtons
                  url={`/blog/${post.slug}`}
                  title={post.title}
                  description={post.meta_description || post.excerpt}
                  image={featuredImage || undefined}
                  contentType="blog"
                  contentId={post.id}
                />
              </div>

              {/* About Author */}
              <AboutAuthorCard authorName={post.author || "Verified BM Shop Team"} />

              <div className="mt-12 border-t border-border pt-8 rounded-xl bg-card p-6">
                <h2 className="text-xl font-bold text-foreground mb-2">Comments</h2>
                <p className="text-sm text-muted-foreground">Comments are currently disabled on the static public version of the site.</p>
              </div>
            </article>

            {/* Sidebar — 25% */}
            <aside className="w-full lg:w-[280px] shrink-0">
              <div className="lg:sticky lg:top-16 space-y-6">
                <BlogTableOfContents contentHtml={sanitizedContent} />
                <FeaturedProductWidget />
              </div>
            </aside>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default BlogPost;
