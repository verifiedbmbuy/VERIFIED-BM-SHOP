import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Loader2, Briefcase, Star, ExternalLink } from "lucide-react";
import MediaLibraryModal from "@/components/admin/MediaLibraryModal";

interface WorkSample {
  id: string;
  title: string;
  client_name: string | null;
  category: string;
  image_url: string | null;
  link: string | null;
  is_featured: boolean;
  sort_order: number | null;
  created_at: string;
}

const categories = ["General", "Web Design", "Advertising", "Social Media", "Branding", "E-Commerce"];

const AdminWorkSamples = () => {
  const [items, setItems] = useState<WorkSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState<Partial<WorkSample>>({});

  const fetch_ = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("work_samples")
      .select("*")
      .order("sort_order", { ascending: true });
    if (!error) setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const openEditor = (item?: WorkSample) => {
    setEdit(item ? { ...item } : { title: "", client_name: "", category: "General", image_url: "", link: "", is_featured: false, sort_order: 0 });
    setEditorOpen(true);
  };

  const handleSave = async () => {
    if (!edit.title?.trim()) { toast.error("Title is required."); return; }
    setSaving(true);
    try {
      const payload = {
        title: edit.title!.trim(),
        client_name: edit.client_name || null,
        category: edit.category || "General",
        image_url: edit.image_url || null,
        link: edit.link || null,
        is_featured: edit.is_featured ?? false,
        sort_order: edit.sort_order ?? 0,
      };
      if (edit.id) {
        const { error } = await supabase.from("work_samples").update(payload).eq("id", edit.id);
        if (error) throw error;
        toast.success("Work sample updated!");
      } else {
        const { error } = await supabase.from("work_samples").insert(payload);
        if (error) throw error;
        toast.success("Work sample created!");
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
    if (!confirm("Delete this work sample?")) return;
    const { error } = await supabase.from("work_samples").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted."); fetch_(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Work Samples</h2>
        <Button onClick={() => openEditor()} className="gap-2"><Plus className="w-4 h-4" /> Add Sample</Button>
      </div>

      <div className="bg-background rounded-xl border border-border">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center">
            <Briefcase className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No work samples yet</h3>
            <p className="text-sm text-muted-foreground">Add your first portfolio item.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                {item.image_url && (
                  <img src={item.image_url} alt={item.title} className="w-16 h-12 rounded object-cover border border-border" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground text-sm truncate">{item.title}</span>
                    {item.is_featured && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />}
                    <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.client_name || "No client"}</span>
                </div>
                <div className="flex items-center gap-1">
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="p-2 text-muted-foreground hover:text-primary">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
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
          <DialogHeader><DialogTitle>{edit.id ? "Edit Work Sample" : "New Work Sample"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Title *</Label><Input value={edit.title ?? ""} onChange={(e) => setEdit({ ...edit, title: e.target.value })} className="mt-1.5" /></div>
            <div><Label>Client Name</Label><Input value={edit.client_name ?? ""} onChange={(e) => setEdit({ ...edit, client_name: e.target.value })} className="mt-1.5" /></div>
            <div>
              <Label>Category</Label>
              <Select value={edit.category || "General"} onValueChange={(v) => setEdit({ ...edit, category: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Project Image</Label>
              <div className="flex gap-2 mt-1.5">
                <Input value={edit.image_url ?? ""} onChange={(e) => setEdit({ ...edit, image_url: e.target.value })} placeholder="Image URL" className="flex-1" />
                <Button variant="outline" size="sm" onClick={() => setMediaOpen(true)}>Browse</Button>
              </div>
              {edit.image_url && <img src={edit.image_url} alt="" className="mt-2 w-full h-32 rounded object-cover border border-border" />}
            </div>
            <div><Label>Link</Label><Input value={edit.link ?? ""} onChange={(e) => setEdit({ ...edit, link: e.target.value })} placeholder="https://..." className="mt-1.5" /></div>
            <div className="flex items-center gap-3">
              <Switch checked={edit.is_featured ?? false} onCheckedChange={(v) => setEdit({ ...edit, is_featured: v })} />
              <Label>Featured on Homepage</Label>
            </div>
            <div><Label>Sort Order</Label><Input type="number" value={edit.sort_order ?? 0} onChange={(e) => setEdit({ ...edit, sort_order: parseInt(e.target.value) || 0 })} className="mt-1.5" /></div>
            <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {edit.id ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <MediaLibraryModal open={mediaOpen} onOpenChange={setMediaOpen} onSelect={(file) => { setEdit({ ...edit, image_url: file.url }); setMediaOpen(false); }} />
    </div>
  );
};

export default AdminWorkSamples;
