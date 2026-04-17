import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FileText, MessageSquare, Mail, ShoppingCart, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export interface FeedItem {
  id: string;
  icon: typeof FileText;
  color: string;
  text: string;
  time: Date;
  link: string;
}

const timeAgo = (date: Date) => {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

interface ActivityFeedProps {
  extraItems?: FeedItem[];
}

const ActivityFeed = ({ extraItems = [] }: ActivityFeedProps) => {
  const [dbItems, setDbItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [commentsRes, subsRes, postsRes, ordersRes] = await Promise.all([
        supabase.from("comments").select("id, author_name, created_at, blog_posts(title)").order("created_at", { ascending: false }).limit(3),
        supabase.from("newsletter_subscribers").select("id, email, created_at").order("created_at", { ascending: false }).limit(3),
        supabase.from("blog_posts").select("id, title, created_at").order("created_at", { ascending: false }).limit(3),
        supabase.from("orders").select("id, customer_name, status, created_at").order("created_at", { ascending: false }).limit(3),
      ]);

      const feed: FeedItem[] = [];

      (commentsRes.data || []).forEach((c: any) => {
        feed.push({
          id: `c-${c.id}`,
          icon: MessageSquare,
          color: "#dba617",
          text: `${c.author_name} commented on "${(c.blog_posts as any)?.title || "a post"}"`,
          time: new Date(c.created_at),
          link: "/admin/comments",
        });
      });

      (subsRes.data || []).forEach((s: any) => {
        feed.push({
          id: `s-${s.id}`,
          icon: Mail,
          color: "#00a32a",
          text: `New subscriber: ${s.email}`,
          time: new Date(s.created_at),
          link: "/admin/subscribers",
        });
      });

      (postsRes.data || []).forEach((p: any) => {
        feed.push({
          id: `p-${p.id}`,
          icon: FileText,
          color: "#2271b1",
          text: `Post created: "${p.title}"`,
          time: new Date(p.created_at),
          link: "/admin/posts",
        });
      });

      (ordersRes.data || []).forEach((o: any) => {
        feed.push({
          id: `o-${o.id}`,
          icon: o.status === "completed" ? CheckCircle : ShoppingCart,
          color: o.status === "completed" ? "#00a32a" : "#2271b1",
          text: `${o.status === "completed" ? "Order completed" : "New order"} by ${o.customer_name}`,
          time: new Date(o.created_at),
          link: "/admin/orders",
        });
      });

      feed.sort((a, b) => b.time.getTime() - a.time.getTime());
      setDbItems(feed.slice(0, 8));
      setLoading(false);
    };
    load();
  }, []);

  // Merge extra items (from QuickDraft) on top of DB items
  const allItems = [...extraItems, ...dbItems].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 10);

  return (
    <div className="bg-white rounded-lg border border-[#dcdcde]">
      <div className="px-5 py-4 border-b border-[#dcdcde]">
        <h3 className="text-sm font-semibold text-gray-900">Activity Feed</h3>
      </div>
      <div className="p-5">
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : allItems.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">No activity yet</p>
        ) : (
          <div className="relative">
            <div className="absolute left-[15px] top-4 bottom-4 w-px bg-gray-200" />
            <div className="space-y-4">
              {allItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.id} className="flex gap-3 relative">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10"
                      style={{ backgroundColor: `${item.color}10` }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <Link to={item.link} className="text-xs text-gray-700 hover:text-[#2271b1] transition-colors line-clamp-2">
                        {item.text}
                      </Link>
                      <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(item.time)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
