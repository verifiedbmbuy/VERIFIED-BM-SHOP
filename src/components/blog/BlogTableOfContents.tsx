import { useEffect, useState } from "react";
import { List } from "lucide-react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface BlogTableOfContentsProps {
  contentHtml: string;
}

const BlogTableOfContents = ({ contentHtml }: BlogTableOfContentsProps) => {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    // Parse headings from the rendered DOM after a tick
    const timer = setTimeout(() => {
      const container = document.querySelector(".blog-content-area");
      if (!container) return;
      const headings = container.querySelectorAll("h2, h3");
      const tocItems: TocItem[] = [];
      headings.forEach((el, i) => {
        const id = el.id || `heading-${i}`;
        if (!el.id) el.id = id;
        tocItems.push({
          id,
          text: el.textContent || "",
          level: el.tagName === "H2" ? 2 : 3,
        });
      });
      setItems(tocItems);
    }, 300);
    return () => clearTimeout(timer);
  }, [contentHtml]);

  useEffect(() => {
    if (items.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );
    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3 uppercase tracking-wide">
        <List className="w-4 h-4 text-primary" /> Table of Contents
      </h3>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.id} style={{ paddingLeft: item.level === 3 ? "1rem" : 0 }}>
            <a
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`block text-sm leading-snug py-1 transition-colors border-l-2 pl-3 ${
                activeId === item.id
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/40"
              }`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default BlogTableOfContents;
