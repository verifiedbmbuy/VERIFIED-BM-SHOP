import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Loader2, HelpCircle } from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  faq_group: string;
  sort_order: number | null;
  created_at: string;
}

const faqGroups = ["General", "Pricing", "Technical", "Shipping", "Support"];

const AdminFAQs = () => {
  const [items, setItems] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState<Partial<FAQ>>({});
  const [filterGroup, setFilterGroup] = useState("all");

  const fetch_ = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("faqs")
      .select("*")
      .order("sort_order", { ascending: true });
    if (!error) setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const openEditor = (item?: FAQ) => {
    setEdit(item ? { ...item } : { question: "", answer: "", faq_group: "General", sort_order: 0 });
    setEditorOpen(true);
  };

  const handleSave = async () => {
    if (!edit.question?.trim() || !edit.answer?.trim()) { toast.error("Question and answer are required."); return; }
    setSaving(true);
    try {
      const payload = {
        question: edit.question!.trim(),
        answer: edit.answer!.trim(),
        faq_group: edit.faq_group || "General",
        sort_order: edit.sort_order ?? 0,
      };
      if (edit.id) {
        const { error } = await supabase.from("faqs").update(payload).eq("id", edit.id);
        if (error) throw error;
        toast.success("FAQ updated!");
      } else {
        const { error } = await supabase.from("faqs").insert(payload);
        if (error) throw error;
        toast.success("FAQ created!");
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
    if (!confirm("Delete this FAQ?")) return;
    const { error } = await supabase.from("faqs").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted."); fetch_(); }
  };

  const filtered = filterGroup === "all" ? items : items.filter((i) => i.faq_group === filterGroup);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-foreground">FAQs</h2>
        <div className="flex items-center gap-3">
          <Select value={filterGroup} onValueChange={setFilterGroup}>
            <SelectTrigger className="w-36"><SelectValue placeholder="All Groups" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {faqGroups.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => openEditor()} className="gap-2"><Plus className="w-4 h-4" /> Add FAQ</Button>
        </div>
      </div>

      <div className="bg-background rounded-xl border border-border">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <HelpCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No FAQs yet</h3>
            <p className="text-sm text-muted-foreground">Add frequently asked questions.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((item) => (
              <div key={item.id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground text-sm">{item.question}</span>
                      <Badge variant="secondary" className="text-xs">{item.faq_group}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.answer}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => openEditor(item)} className="p-2 text-primary hover:bg-primary/10 rounded"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => deleteItem(item.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{edit.id ? "Edit FAQ" : "New FAQ"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Question *</Label><Input value={edit.question ?? ""} onChange={(e) => setEdit({ ...edit, question: e.target.value })} className="mt-1.5" /></div>
            <div><Label>Answer *</Label><Textarea value={edit.answer ?? ""} onChange={(e) => setEdit({ ...edit, answer: e.target.value })} rows={5} className="mt-1.5" placeholder="Supports plain text or HTML" /></div>
            <div>
              <Label>Group</Label>
              <Select value={edit.faq_group || "General"} onValueChange={(v) => setEdit({ ...edit, faq_group: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>{faqGroups.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Sort Order</Label><Input type="number" value={edit.sort_order ?? 0} onChange={(e) => setEdit({ ...edit, sort_order: parseInt(e.target.value) || 0 })} className="mt-1.5" /></div>
            <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {edit.id ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFAQs;
