import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import IconPicker from "@/components/admin/IconPicker";
import DynamicIcon from "@/components/shared/DynamicIcon";

interface MenuItem {
  id: string;
  label: string;
  url: string;
  position: string;
  sort_order: number;
  icon: string | null;
  icon_name: string | null;
}

const positions = [
  { value: "header", label: "Header Menu" },
  { value: "footer-quick", label: "Footer – Quick Links" },
  { value: "footer-trust", label: "Footer – Trust Center" },
];

const AdminMenus = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [form, setForm] = useState({ label: "", url: "", position: "header", icon: "", icon_name: null as string | null });

  const { data: pages } = useQuery({
    queryKey: ["admin-pages-list"],
    queryFn: async () => {
      const { data } = await supabase.from("pages").select("slug,title").eq("status", "published").order("title");
      return data || [];
    },
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin-menus"],
    queryFn: async () => {
      const { data } = await supabase.from("menus").select("*").order("sort_order");
      return (data || []) as MenuItem[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (item: Partial<MenuItem> & { id?: string }) => {
      if (item.id) {
        const { error } = await supabase.from("menus").update({ label: item.label, url: item.url, position: item.position, icon: item.icon, icon_name: item.icon_name, sort_order: item.sort_order }).eq("id", item.id);
        if (error) throw error;
      } else {
        const maxOrder = items.filter(i => i.position === item.position).length;
        const { error } = await supabase.from("menus").insert({ label: item.label!, url: item.url!, position: item.position!, icon: item.icon || null, icon_name: item.icon_name || null, sort_order: maxOrder });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-menus"] });
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      toast({ title: editing ? "Menu item updated" : "Menu item added" });
      closeDialog();
    },
    onError: () => toast({ title: "Error saving menu item", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("menus").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-menus"] });
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      toast({ title: "Menu item deleted" });
    },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm({ label: "", url: "", position: "header", icon: "", icon_name: null });
  };

  const openAdd = (position: string) => {
    setEditing(null);
    setForm({ label: "", url: "", position, icon: "", icon_name: null });
    setDialogOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditing(item);
    setForm({ label: item.label, url: item.url, position: item.position, icon: item.icon || "", icon_name: item.icon_name || null });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.label.trim() || !form.url.trim()) return;
    saveMutation.mutate({
      id: editing?.id,
      label: form.label.trim(),
      url: form.url.trim(),
      position: form.position,
      icon: form.icon.trim() || null,
      icon_name: form.icon_name || null,
      sort_order: editing?.sort_order ?? 0,
    });
  };

  const renderList = (position: string) => {
    const filtered = items.filter(i => i.position === position);
    if (isLoading) return <div className="py-8 text-center text-muted-foreground text-sm">Loading…</div>;
    if (!filtered.length) return <div className="py-8 text-center text-muted-foreground text-sm">No menu items yet. Click "Add Item" to create one.</div>;

    return (
      <div className="space-y-1">
        {filtered.map((item) => (
          <div key={item.id} className="flex items-center gap-3 px-4 py-3 bg-background border border-border rounded-lg">
            <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />
            {item.icon_name && <DynamicIcon name={item.icon_name} className="w-4 h-4 text-muted-foreground shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
              <p className="text-xs text-muted-foreground truncate">{item.url}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
              <Pencil className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(item.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Navigation Menus</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage header and footer navigation links.</p>
      </div>

      <Tabs defaultValue="header">
        <TabsList>
          {positions.map(p => (
            <TabsTrigger key={p.value} value={p.value}>{p.label}</TabsTrigger>
          ))}
        </TabsList>

        {positions.map(p => (
          <TabsContent key={p.value} value={p.value} className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => openAdd(p.value)}>
                <Plus className="w-4 h-4 mr-1" /> Add Item
              </Button>
            </div>
            {renderList(p.value)}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) closeDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-foreground">Label</label>
              <Input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Homepage" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">URL or Page</label>
              <Select value={form.url} onValueChange={v => setForm(f => ({ ...f, url: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a page or type custom URL" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="/">/ (Homepage)</SelectItem>
                  <SelectItem value="/shop">/shop</SelectItem>
                  <SelectItem value="/blog">/blog</SelectItem>
                  <SelectItem value="/contact">/contact</SelectItem>
                  <SelectItem value="/about">/about</SelectItem>
                  <SelectItem value="/faq">/faq</SelectItem>
                  <SelectItem value="/terms">/terms</SelectItem>
                  <SelectItem value="/privacy">/privacy</SelectItem>
                  <SelectItem value="/refund-policy">/refund-policy</SelectItem>
                  <SelectItem value="/replacement-guarantee">/replacement-guarantee</SelectItem>
                  {pages?.map(p => (
                    <SelectItem key={p.slug} value={`/page/${p.slug}`}>{p.title} (/page/{p.slug})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input className="mt-2" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="Or type a custom URL like /custom-page" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Position</label>
              <Select value={form.position} onValueChange={v => setForm(f => ({ ...f, position: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {positions.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Icon (optional)</label>
              <IconPicker value={form.icon_name} onChange={(v) => setForm(f => ({ ...f, icon_name: v }))} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving…" : editing ? "Update" : "Add"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMenus;
