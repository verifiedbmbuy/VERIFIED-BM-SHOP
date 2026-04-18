import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Search, FileText, ArrowUpDown, Wand2, Loader2 } from "lucide-react";
import { computeSEOScore, getScoreBadgeClasses, SEOScoreResult } from "@/lib/seoScoring";
import SEOQuickFixPopup from "@/components/admin/SEOQuickFixPopup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  focus_keyword?: string | null;
  featured_image: string | null;
  category: string;
  read_time: string | null;
  published_at: string | null;
  created_at: string;
  author: string;
  status: string;
}




type SortField = "title" | "author" | "status" | "created_at";
type SortDir = "asc" | "desc";

const AdminPosts = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [seoPopup, setSeoPopup] = useState<{ post: BlogPost; result: SEOScoreResult } | null>(null);
  const [bulkScanning, setBulkScanning] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load posts.");
      setPosts([]);
    } else {
      setPosts((data as unknown as BlogPost[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", deleteId);
    if (error) toast.error("Failed to delete post.");
    else toast.success("Post deleted.");
    setDeleteId(null);
    fetchPosts();
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const filteredPosts = posts
    .filter((p) => p.title.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => statusFilter === "all" || p.status === statusFilter)
    .sort((a, b) => {
      const aVal = (a[sortField] || "").toString().toLowerCase();
      const bVal = (b[sortField] || "").toString().toLowerCase();
      return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  const seoScores = useMemo(() => {
    const map = new Map<string, SEOScoreResult>();
    posts.forEach((p) => {
      map.set(p.id, computeSEOScore({
        title: p.title,
        slug: p.slug,
        metaTitle: p.meta_title,
        metaDescription: p.meta_description,
        focusKeyword: p.focus_keyword,
        content: p.content,
        urlPrefix: "/blog/",
      }));
    });
    return map;
  }, [posts]);

  const bulkAIScan = async () => {
    setBulkScanning(true);
    let fixCount = 0;
    for (const p of posts) {
      const result = seoScores.get(p.id);
      if (!result || result.score >= 80) continue;
      try {
        const updates: Record<string, any> = {};
        const kw = p.focus_keyword || p.title;
        if (result.issues.some((i) => i.includes("description"))) {
          const { data } = await supabase.functions.invoke("seo-ai-fix", {
            body: { action: "fix_meta_description", context: { focusKeyword: kw, productTitle: p.title } },
          });
          if (data?.metaDescription) updates.meta_description = data.metaDescription;
        }
        if (result.issues.some((i) => i.includes("title"))) {
          const { data } = await supabase.functions.invoke("seo-ai-fix", {
            body: { action: "fix_meta_title", context: { focusKeyword: kw, productTitle: p.title } },
          });
          if (data?.metaTitle) updates.meta_title = data.metaTitle;
        }
        if (Object.keys(updates).length > 0) {
          await supabase.from("blog_posts").update(updates).eq("id", p.id);
          fixCount++;
        }
      } catch { /* skip */ }
    }
    toast.success(`AI scan complete. Fixed ${fixCount} post(s).`);
    setBulkScanning(false);
    fetchPosts();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">Posts</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={bulkAIScan} disabled={bulkScanning} className="gap-1.5">
            {bulkScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
            AI Scan All
          </Button>
          <Button onClick={() => navigate("/admin/posts/new")} className="gap-2">
            <Plus className="w-4 h-4" />
            New Post
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts…"
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-background rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Loading…</div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No posts found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {search || statusFilter !== "all"
                ? "Try adjusting your search or filter."
                : "No real blog posts exist yet. Create one here and it will appear on the public website when published."}
            </p>
            {!search && statusFilter === "all" && (
              <Button onClick={() => navigate("/admin/posts/new")} className="gap-2">
                <Plus className="w-4 h-4" />
                Create First Post
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button onClick={() => toggleSort("title")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Title <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead className="hidden sm:table-cell">
                  <button onClick={() => toggleSort("author")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Author <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  <button onClick={() => toggleSort("status")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Status <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead className="hidden md:table-cell">SEO</TableHead>
                <TableHead className="hidden md:table-cell">
                  <button onClick={() => toggleSort("created_at")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Date <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPosts.map((post) => (
                <TableRow
                  key={post.id}
                  className="cursor-pointer"
                  onClick={() => navigate(post.id.startsWith("mock-") ? "/admin/posts/new" : `/admin/posts/${post.id}/edit`)}
                >
                  <TableCell className="font-medium text-foreground">
                    <div>
                      {post.title}
                      <span className="block text-xs text-muted-foreground mt-0.5 sm:hidden">
                        {post.author}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {post.author}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge
                      variant={post.status === "published" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {post.status === "published" ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {(() => {
                      const result = seoScores.get(post.id);
                      if (!result) return null;
                      return (
                        <button
                          onClick={(e) => { e.stopPropagation(); setSeoPopup({ post, result }); }}
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold cursor-pointer transition-colors hover:opacity-80 ${getScoreBadgeClasses(result.score)}`}
                          title="Click to quick-fix SEO"
                        >
                          {result.score}
                        </button>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {new Date(post.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(post.id);
                      }}
                      className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The post will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* SEO Quick Fix Popup */}
      {seoPopup && (
        <SEOQuickFixPopup
          itemTitle={seoPopup.post.title}
          seoResult={seoPopup.result}
          onClose={() => setSeoPopup(null)}
          onFixed={async (updates) => {
            if (!seoPopup.post.id.startsWith("mock-")) {
              await supabase.from("blog_posts").update(updates).eq("id", seoPopup.post.id);
            }
            setSeoPopup(null);
            fetchPosts();
          }}
        />
      )}
    </div>
  );
};

export default AdminPosts;
