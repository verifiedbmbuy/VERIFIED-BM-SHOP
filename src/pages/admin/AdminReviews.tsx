import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, Star, Trash2, CheckCircle, XCircle, MessageCircle } from "lucide-react";

interface Review {
  id: string;
  user_id: string;
  product_id: string;
  order_id: string;
  rating: number;
  review_text: string;
  comment?: string;
  status: string;
  created_at: string;
  product_title?: string;
  product_name?: string;
  customer_name?: string;
}

const StatusBadge = ({ status }: { status: string }) => {
  const normalized = (status || "pending").toLowerCase();
  const label = normalized === "approved" ? "Approved" : normalized === "rejected" ? "Rejected" : "Pending";
  const className =
    normalized === "approved"
      ? "bg-green-500/15 text-green-600 border-green-500/30"
      : normalized === "rejected"
        ? "bg-red-500/15 text-red-600 border-red-500/30"
        : "bg-yellow-500/15 text-yellow-700 border-yellow-500/30";

  return <Badge variant="outline" className={`capitalize text-xs ${className}`}>{label}</Badge>;
};

const RatingStars = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} className={`w-3.5 h-3.5 ${i <= rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/20"}`} />
    ))}
  </div>
);

/**
 * Synchronous Testimonial Sync Logic
 *
 * On APPROVE:
 *   1. Update product_reviews.status = 'approved'
 *   2. Check if testimonials row with review_id already exists (de-dup)
 *   3. If not, INSERT into testimonials with strict field mapping:
 *        customer_name  ->  client_name
 *        review_text    ->  testimonial_text
 *        rating         ->  rating
 *        product_title  ->  job_title  (formatted as "Verified Buyer - [Product]")
 *        review.id      ->  review_id  (foreign link for de-dup & cleanup)
 *
 * On REJECT / DELETE:
 *   Delete from testimonials WHERE review_id = review.id
 */

const getReviewComment = (review: Review) => review.review_text || review.comment || "";

const getProductName = (review: Review) => review.product_title || review.product_name || "Product";

const logReviewStatusFromDb = async (reviewId: string) => {
  const { data, error } = await supabase
    .from("product_reviews")
    .select("id, status")
    .eq("id", reviewId)
    .single();

  if (error) {
    console.error("Failed to verify review status after mutation:", error);
    return;
  }

  console.log("New status from DB:", data);
};

const syncTestimonialInsert = async (review: Review) => {
  // De-duplication: check if already synced
  const { data: existing, error: existingError } = await (supabase
    .from("testimonials")
    .select("id") as any)
    .eq("review_id", review.id)
    .maybeSingle();

  if (existingError) throw new Error(`Testimonial lookup failed: ${existingError.message}`);
  if (existing) return; // already synced, skip

  const { error } = await (supabase.from("testimonials") as any).insert({
    client_name: review.customer_name || "Verified Buyer",
    job_title: `Verified Buyer - ${getProductName(review)}`,
    rating: review.rating,
    testimonial_text: getReviewComment(review),
    status: "approved",
    sort_order: 0,
    review_id: review.id,
  });

  if (error) throw new Error(`Testimonial sync failed: ${error.message}`);
};

const syncTestimonialDelete = async (reviewId: string) => {
  const { error } = await (supabase
    .from("testimonials")
    .delete() as any)
    .eq("review_id", reviewId);

  if (error) throw new Error(`Testimonial cleanup failed: ${error.message}`);
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown database error";
  }
};

const showAdminSyncError = (action: string, error: unknown) => {
  const message = `${action} failed: ${getErrorMessage(error)}`;
  toast.error(message);
  window.alert(message);
};

const AdminReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const fetchReviews = async () => {
    setLoading(true);
    const { data: revData, error } = await supabase
      .from("product_reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load reviews");
      setLoading(false);
      return;
    }

    if (!revData || revData.length === 0) {
      setReviews([]);
      setLoading(false);
      return;
    }

    const productIds = [...new Set(revData.map((r) => r.product_id))];
    const userIds = [...new Set(revData.map((r) => r.user_id))];

    const [{ data: products }, { data: profiles }] = await Promise.all([
      supabase.from("products").select("id, title").in("id", productIds),
      supabase.from("profiles").select("id, full_name").in("id", userIds),
    ]);

    const productMap = new Map((products || []).map((p) => [p.id, p.title]));
    const profileMap = new Map((profiles || []).map((p) => [p.id, p.full_name]));

    setReviews(
      revData.map((r) => ({
        ...r,
        product_title: productMap.get(r.product_id) || "Unknown Product",
        product_name: productMap.get(r.product_id) || "Unknown Product",
        customer_name: profileMap.get(r.user_id) || "Unknown User",
      }))
    );
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, []);

  /* ── APPROVE ── */
  const handleApprove = async (review: Review) => {
    setActionId(review.id);
    try {
      const { error: updateErr } = await supabase
        .from("product_reviews")
        .update({ status: "approved" })
        .eq("id", review.id);
      if (updateErr) throw updateErr;

      setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, status: "approved" } : r)));
      await logReviewStatusFromDb(review.id);

      await syncTestimonialInsert(review);
      await queryClient.invalidateQueries({ queryKey: ["product_reviews"] });
      await fetchReviews();

      toast.success("Review approved & synced to testimonials!");
    } catch (error) {
      showAdminSyncError("Approve sync", error);
    } finally {
      setActionId(null);
    }
  };

  /* ── REJECT ── */
  const handleReject = async (review: Review) => {
    setActionId(review.id);
    try {
      const { error: updateErr } = await supabase
        .from("product_reviews")
        .update({ status: "rejected" })
        .eq("id", review.id);
      if (updateErr) throw updateErr;

      setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, status: "rejected" } : r)));
      await logReviewStatusFromDb(review.id);

      await syncTestimonialDelete(review.id);
      await queryClient.invalidateQueries({ queryKey: ["product_reviews"] });
      await fetchReviews();

      toast.success("Review rejected & testimonial removed.");
    } catch (error) {
      showAdminSyncError("Reject sync", error);
    } finally {
      setActionId(null);
    }
  };

  /* ── DELETE ── */
  const handleDelete = async () => {
    if (!deleteId) return;

    setActionId(deleteId);
    try {
      await syncTestimonialDelete(deleteId);

      const { error } = await supabase.from("product_reviews").delete().eq("id", deleteId);
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["product_reviews"] });
      await fetchReviews();
      toast.success("Review & testimonial deleted.");
    } catch (error) {
      showAdminSyncError("Delete sync", error);
    } finally {
      setDeleteId(null);
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Product Reviews</h2>
        <Badge variant="secondary" className="text-xs">{reviews.length} total</Badge>
      </div>

      <div className="bg-background rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Loading…</div>
        ) : reviews.length === 0 ? (
          <div className="p-16 text-center">
            <MessageCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No reviews yet</h3>
            <p className="text-sm text-muted-foreground">Product reviews from customers will appear here.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead className="max-w-[300px]">Comment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium text-sm">{r.customer_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.product_title}</TableCell>
                  <TableCell><RatingStars rating={r.rating} /></TableCell>
                  <TableCell className="max-w-[300px] text-sm text-muted-foreground truncate">{r.review_text}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="gap-1"
                        disabled={actionId === r.id}
                        onClick={() => handleApprove(r)}
                      >
                        {actionId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        disabled={actionId === r.id}
                        onClick={() => handleReject(r)}
                      >
                        {actionId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 text-muted-foreground hover:text-destructive"
                        disabled={actionId === r.id}
                        onClick={() => setDeleteId(r.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
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
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this review and its linked testimonial (if any). This action cannot be undone.</AlertDialogDescription>
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

export default AdminReviews;
