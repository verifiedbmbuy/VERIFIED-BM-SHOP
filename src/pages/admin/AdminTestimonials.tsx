import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Loader2, MessageCircle, Star } from "lucide-react";
import MediaLibraryModal from "@/components/admin/MediaLibraryModal";

interface Testimonial {
  id: string;
  client_name: string;
  job_title: string | null;
  rating: number;
  testimonial_text: string;
  avatar_url: string | null;
  status: string;
  sort_order: number | null;
  created_at: string;
}

const AdminTestimonials = () => {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState<Partial<Testimonial>>({});

  const fetch_ = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("sort_order", { ascending: true });
    if (!error) setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const openEditor = (item?: Testimonial) => {
    setEdit(item ? { ...item } : { client_name: "", job_title: "", rating: 5, testimonial_text: "", avatar_url: "", status: "approved", sort_order: 0 });
    setEditorOpen(true);
  };

  const handleSave = async () => {
    if (!edit.client_name?.trim() || !edit.testimonial_text?.trim()) { toast.error("Name and text are required."); return; }
    setSaving(true);
    try {
      const payload = {
        client_name: edit.client_name!.trim(),
        job_title: edit.job_title || null,
        rating: edit.rating ?? 5,
        testimonial_text: edit.testimonial_text!.trim(),
        avatar_url: edit.avatar_url || null,
        status: edit.status || "approved",
        sort_order: edit.sort_order ?? 0,
      };
      if (edit.id) {
        const { error } = await supabase.from("testimonials").update(payload).eq("id", edit.id);
        if (error) throw error;
        toast.success("Testimonial updated!");
      } else {
        const { error } = await supabase.from("testimonials").insert(payload);
        if (error) throw error;
        toast.success("Testimonial created!");
      }
      setEditorOpen(false);
      fetch_();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;
    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted."); fetch_(); }
  };

  const RatingStars = ({ rating }: { rating: number }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Testimonials</h2>
        <Button onClick={() => openEditor()} className="gap-2"><Plus className="w-4 h-4" /> Add Testimonial</Button>
      </div>

      <div className="bg-background rounded-xl border border-border">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center">
            <MessageCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No testimonials yet</h3>
            <p className="text-sm text-muted-foreground">Add client testimonials for social proof.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                {item.avatar_url ? (
                  <img src={item.avatar_url} alt={item.client_name} className="w-10 h-10 rounded-full object-cover border border-border" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {item.client_name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground text-sm">{item.client_name}</span>
                    <RatingStars rating={item.rating} />
                    <Badge variant={item.status === "approved" ? "default" : "secondary"} className="text-xs capitalize">{item.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{item.job_title || "—"} · "{item.testimonial_text.slice(0, 60)}…"</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEditor(item)} className="p-2 text-primary hover:bg-primary/10 rounded"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => deleteItem(item.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{edit.id ? "Edit Testimonial" : "New Testimonial"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Client Name *</Label><Input value={edit.client_name ?? ""} onChange={(e) => setEdit({ ...edit, client_name: e.target.value })} className="mt-1.5" /></div>
            <div><Label>Job Title / Company</Label><Input value={edit.job_title ?? ""} onChange={(e) => setEdit({ ...edit, job_title: e.target.value })} className="mt-1.5" /></div>
            <div>
              <Label>Rating</Label>
              <div className="flex gap-1 mt-1.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button key={i} type="button" onClick={() => setEdit({ ...edit, rating: i })}>
                    <Star className={`w-6 h-6 cursor-pointer ${i <= (edit.rating ?? 5) ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div><Label>Testimonial Text *</Label><Textarea value={edit.testimonial_text ?? ""} onChange={(e) => setEdit({ ...edit, testimonial_text: e.target.value })} rows={4} className="mt-1.5" /></div>
            <div>
              <Label>Client Avatar</Label>
              <div className="flex gap-2 mt-1.5">
                <Input value={edit.avatar_url ?? ""} onChange={(e) => setEdit({ ...edit, avatar_url: e.target.value })} placeholder="Avatar URL" className="flex-1" />
                <Button variant="outline" size="sm" onClick={() => setMediaOpen(true)}>Browse</Button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={edit.status === "approved"} onCheckedChange={(v) => setEdit({ ...edit, status: v ? "approved" : "hidden" })} />
              <Label>{edit.status === "approved" ? "Approved (Visible)" : "Hidden"}</Label>
            </div>
            <div><Label>Sort Order</Label><Input type="number" value={edit.sort_order ?? 0} onChange={(e) => setEdit({ ...edit, sort_order: parseInt(e.target.value) || 0 })} className="mt-1.5" /></div>
            <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {edit.id ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <MediaLibraryModal open={mediaOpen} onOpenChange={setMediaOpen} onSelect={(file) => { setEdit({ ...edit, avatar_url: file.url }); setMediaOpen(false); }} />
    </div>
  );
};

export default AdminTestimonials;
