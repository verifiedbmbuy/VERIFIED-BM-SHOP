import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, Trash2, MessageSquare, Search, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface Comment {
  id: string;
  post_id: string;
  author_name: string;
  author_email: string;
  content: string;
  status: string;
  created_at: string;
  parent_id: string | null;
  blog_posts?: { title: string } | null;
}

const AdminComments = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchComments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("comments")
      .select("*, blog_posts(title)")
      .order("created_at", { ascending: false });
    if (!error && data) setComments(data as unknown as Comment[]);
    setLoading(false);
  };

  useEffect(() => { fetchComments(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("comments").update({ status }).eq("id", id);
    if (error) toast.error("Failed to update.");
    else {
      const labels: Record<string, string> = { approved: "Comment approved.", rejected: "Comment rejected.", spam: "Moved to spam." };
      toast.success(labels[status] || "Status updated.");
    }
    fetchComments();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("comments").delete().eq("id", deleteId);
    if (error) toast.error("Failed to delete.");
    else toast.success("Comment deleted.");
    setDeleteId(null);
    fetchComments();
  };

  const filtered = comments
    .filter((c) => c.author_name.toLowerCase().includes(search.toLowerCase()) || c.content.toLowerCase().includes(search.toLowerCase()))
    .filter((c) => statusFilter === "all" || c.status === statusFilter);

  const counts = {
    all: comments.length,
    pending: comments.filter((c) => c.status === "pending").length,
    approved: comments.filter((c) => c.status === "approved").length,
    spam: comments.filter((c) => c.status === "spam").length,
    rejected: comments.filter((c) => c.status === "rejected").length,
  };

  const statusColor = (s: string) => {
    if (s === "approved") return "default";
    if (s === "spam") return "outline";
    if (s === "rejected") return "destructive";
    return "secondary";
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Comments</h2>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({counts.approved})</TabsTrigger>
          <TabsTrigger value="spam">Spam ({counts.spam})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({counts.rejected})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search comments…" className="pl-9" />
      </div>

      <div className="bg-background rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No comments</h3>
            <p className="text-sm text-muted-foreground">Comments will appear here when visitors leave them on blog posts.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Author</TableHead>
                <TableHead className="hidden md:table-cell">Comment</TableHead>
                <TableHead className="hidden sm:table-cell">Post</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-36"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div>
                      <span className="font-medium text-foreground block">{c.author_name}</span>
                      <span className="text-xs text-muted-foreground">{c.author_email}</span>
                      {c.parent_id && <span className="text-xs text-primary ml-1">(reply)</span>}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-xs truncate">{c.content}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {(c.blog_posts as any)?.title || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColor(c.status) as any} className="text-xs capitalize">{c.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {c.status !== "approved" && (
                        <button onClick={() => updateStatus(c.id, "approved")} className="p-1.5 rounded text-muted-foreground hover:text-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,45%)]/10 transition-colors" title="Approve">
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      {c.status !== "spam" && (
                        <button onClick={() => updateStatus(c.id, "spam")} className="p-1.5 rounded text-muted-foreground hover:text-[hsl(45,93%,47%)] hover:bg-[hsl(45,93%,47%)]/10 transition-colors" title="Spam">
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this comment?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminComments;
