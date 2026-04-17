import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Reply, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import DOMPurify from "dompurify";
import { z } from "zod";

const commentSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
  email: z.string().trim().email("Please enter a valid email.").max(255),
  content: z.string().trim().min(1, "Comment cannot be empty.").max(2000, "Comment is too long (max 2000 chars)."),
});

interface Comment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
  parent_id: string | null;
}

const RATE_LIMIT_KEY = "last_comment_time";
const RATE_LIMIT_MS = 60000;

const CommentSection = ({ postId }: { postId: string }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [collapsedThreads, setCollapsedThreads] = useState<Set<string>>(new Set());
  const formRef = useRef<HTMLFormElement>(null);

  const fetchComments = async () => {
    const { data } = await supabase
      .from("comments_public" as any)
      .select("id, author_name, content, created_at, parent_id")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    if (data) setComments(data as unknown as Comment[]);
    setLoading(false);
  };

  useEffect(() => { fetchComments(); }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot
    if (honeypot) return;

    const result = commentSchema.safeParse({ name, email, content });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    // Rate limiting
    const lastTime = localStorage.getItem(RATE_LIMIT_KEY);
    if (lastTime && Date.now() - parseInt(lastTime) < RATE_LIMIT_MS) {
      const remaining = Math.ceil((RATE_LIMIT_MS - (Date.now() - parseInt(lastTime))) / 1000);
      toast.error(`Please wait ${remaining}s before posting another comment.`);
      return;
    }

    setSubmitting(true);

    const sanitizedContent = DOMPurify.sanitize(result.data.content, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

    const insertData: any = {
      post_id: postId,
      author_name: DOMPurify.sanitize(result.data.name, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }),
      author_email: result.data.email.trim(),
      content: sanitizedContent,
    };
    if (replyTo) insertData.parent_id = replyTo;

    const { error } = await supabase.from("comments").insert(insertData);
    if (error) {
      toast.error("Failed to submit comment.");
    } else {
      toast.success("Your comment is awaiting moderation.");
      localStorage.setItem(RATE_LIMIT_KEY, Date.now().toString());
      setName(""); setEmail(""); setContent(""); setReplyTo(null);
    }
    setSubmitting(false);
  };

  const topLevel = comments.filter((c) => !c.parent_id);
  const getReplies = (parentId: string): Comment[] =>
    comments.filter((c) => c.parent_id === parentId);

  const toggleThread = (id: string) => {
    setCollapsedThreads((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleReply = (id: string) => {
    setReplyTo(id);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const renderComment = (c: Comment, depth = 0) => {
    const replies = getReplies(c.id);
    const collapsed = collapsedThreads.has(c.id);

    return (
      <div key={c.id} style={{ marginLeft: depth > 0 ? Math.min(depth * 24, 72) : 0 }}>
        <div className={`bg-secondary/30 rounded-lg p-4 ${depth > 0 ? "border-l-2 border-primary/20" : ""}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-foreground text-sm">{DOMPurify.sanitize(c.author_name)}</span>
            <span className="text-xs text-muted-foreground">
              {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
          <p className="text-sm text-foreground/80">{c.content}</p>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => handleReply(c.id)}
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
            >
              <Reply className="w-3 h-3" /> Reply
            </button>
            {replies.length > 0 && (
              <button
                onClick={() => toggleThread(c.id)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                {collapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                {replies.length} {replies.length === 1 ? "reply" : "replies"}
              </button>
            )}
          </div>
        </div>
        {!collapsed && replies.length > 0 && (
          <div className="mt-2 space-y-2">
            {replies.map((r) => renderComment(r, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const replyingToComment = replyTo ? comments.find((c) => c.id === replyTo) : null;

  return (
    <section className="mt-12 border-t border-border pt-8">
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5" /> Comments ({comments.length})
      </h2>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading comments…</p>
      ) : topLevel.length > 0 ? (
        <div className="space-y-3 mb-8">
          {topLevel.map((c) => renderComment(c))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mb-8">No comments yet. Be the first to share your thoughts!</p>
      )}

      <div className="bg-background border border-border rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-4">
          {replyingToComment ? (
            <span className="flex items-center gap-2">
              Replying to {replyingToComment.author_name}
              <button onClick={() => setReplyTo(null)} className="text-xs text-muted-foreground hover:text-destructive">Cancel</button>
            </span>
          ) : "Leave a Comment"}
        </h3>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
          {/* Honeypot */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute opacity-0 h-0 w-0 overflow-hidden pointer-events-none"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name *" maxLength={100} />
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email * (not public)" maxLength={255} />
          </div>
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your comment…" rows={4} maxLength={2000} />
          <Button type="submit" disabled={submitting} className="gap-2">
            <Send className="w-4 h-4" /> {submitting ? "Submitting…" : "Submit Comment"}
          </Button>
        </form>
      </div>
    </section>
  );
};

export default CommentSection;
