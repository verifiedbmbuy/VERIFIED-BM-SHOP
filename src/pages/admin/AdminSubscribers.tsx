import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Search, Mail, Download, Send, Megaphone, ToggleLeft, ToggleRight, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface Subscriber {
  id: string;
  email: string;
  status: string;
  created_at: string;
}

interface SiteNotice {
  id: string;
  message: string;
  type: string;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
}

interface Newsletter {
  id: string;
  subject: string;
  content: string;
  target_audience: string;
  recipient_count: number;
  sent_at: string;
}

const AdminSubscribers = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Newsletter modal
  const [showSendModal, setShowSendModal] = useState(false);
  const [nlSubject, setNlSubject] = useState("");
  const [nlContent, setNlContent] = useState("");
  const [nlTarget, setNlTarget] = useState("subscribers");
  const [sending, setSending] = useState(false);

  // Notices
  const [notices, setNotices] = useState<SiteNotice[]>([]);
  const [noticeMsg, setNoticeMsg] = useState("");
  const [noticeType, setNoticeType] = useState("bar");
  const [savingNotice, setSavingNotice] = useState(false);
  const [editNoticeId, setEditNoticeId] = useState<string | null>(null);
  const [editNoticeMsg, setEditNoticeMsg] = useState("");

  // History
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);

  const fetchSubscribers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setSubscribers(data as Subscriber[]);
    setLoading(false);
  };

  const fetchNotices = async () => {
    const { data } = await supabase
      .from("site_notices")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setNotices(data as SiteNotice[]);
  };

  const fetchNewsletters = async () => {
    const { data } = await supabase
      .from("newsletters")
      .select("*")
      .order("sent_at", { ascending: false })
      .limit(20);
    if (data) setNewsletters(data as Newsletter[]);
  };

  useEffect(() => {
    fetchSubscribers();
    fetchNotices();
    fetchNewsletters();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", deleteId);
    if (error) toast.error("Failed to delete.");
    else toast.success("Subscriber removed.");
    setDeleteId(null);
    fetchSubscribers();
  };

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === "subscribed" ? "unsubscribed" : "subscribed";
    const { error } = await supabase.from("newsletter_subscribers").update({ status: newStatus }).eq("id", id);
    if (error) toast.error("Failed to update.");
    else toast.success(`Status changed to ${newStatus}.`);
    fetchSubscribers();
  };

  const exportCSV = () => {
    const rows = [["Email", "Status", "Date Joined"]];
    filtered.forEach((s) => {
      rows.push([s.email, s.status, new Date(s.created_at).toLocaleDateString("en-US")]);
    });
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  };

  const handleSendNewsletter = async () => {
    if (!nlSubject.trim() || !nlContent.trim()) {
      toast.error("Subject and content are required.");
      return;
    }
    setSending(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        toast.error("You must be logged in.");
        setSending(false);
        return;
      }

      const res = await supabase.functions.invoke("send-newsletter", {
        body: {
          subject: nlSubject,
          content: nlContent,
          target_audience: nlTarget,
        },
      });

      if (res.error) {
        const msg = res.error.message || "Failed to send newsletter.";
        toast.error(msg);
      } else {
        const result = res.data;
        if (result?.error) {
          toast.error(result.error);
        } else {
          toast.success(`Newsletter sent! ${result.sent}/${result.total} delivered.`);
          setShowSendModal(false);
          setNlSubject("");
          setNlContent("");
          setNlTarget("subscribers");
          fetchNewsletters();
        }
      }
    } catch {
      toast.error("Failed to send newsletter.");
    }
    setSending(false);
  };

  const handleCreateNotice = async () => {
    if (!noticeMsg.trim()) {
      toast.error("Notice message is required.");
      return;
    }
    setSavingNotice(true);
    const { error } = await supabase.from("site_notices").insert({
      message: noticeMsg,
      type: noticeType,
      is_active: noticeType === "bar",
    });
    if (error) toast.error("Failed to create notice.");
    else {
      toast.success(noticeType === "bar" ? "Announcement bar activated!" : "Email notice logged!");
      setNoticeMsg("");
      fetchNotices();
    }
    setSavingNotice(false);
  };

  const toggleNoticeActive = async (id: string, current: boolean) => {
    // Deactivate all others first if activating
    if (!current) {
      await supabase.from("site_notices").update({ is_active: false }).eq("type", "bar");
    }
    const { error } = await supabase.from("site_notices").update({ is_active: !current }).eq("id", id);
    if (error) toast.error("Failed to toggle.");
    else toast.success(!current ? "Notice activated." : "Notice deactivated.");
    fetchNotices();
  };

  const deleteNotice = async (id: string) => {
    await supabase.from("site_notices").delete().eq("id", id);
    toast.success("Notice deleted.");
    fetchNotices();
  };

  const startEditNotice = (n: SiteNotice) => {
    setEditNoticeId(n.id);
    setEditNoticeMsg(n.message);
  };

  const saveEditNotice = async () => {
    if (!editNoticeId || !editNoticeMsg.trim()) return;
    const { error } = await supabase
      .from("site_notices")
      .update({ message: editNoticeMsg.trim() })
      .eq("id", editNoticeId);
    if (error) toast.error("Failed to update notice.");
    else toast.success("Notice updated.");
    setEditNoticeId(null);
    setEditNoticeMsg("");
    fetchNotices();
  };

  const filtered = subscribers
    .filter((s) => s.email.toLowerCase().includes(search.toLowerCase()))
    .filter((s) => statusFilter === "all" || s.status === statusFilter);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="subscribers" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="subscribers" className="gap-2"><Mail className="w-4 h-4" /> Subscribers</TabsTrigger>
          <TabsTrigger value="notices" className="gap-2"><Megaphone className="w-4 h-4" /> Site Notices</TabsTrigger>
          <TabsTrigger value="history" className="gap-2"><Send className="w-4 h-4" /> Sent History</TabsTrigger>
        </TabsList>

        {/* === SUBSCRIBERS TAB === */}
        <TabsContent value="subscribers" className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-foreground">Subscribers</h2>
            <div className="flex gap-2">
              <Button onClick={() => setShowSendModal(true)} className="gap-2">
                <Send className="w-4 h-4" /> Send Newsletter
              </Button>
              <Button onClick={exportCSV} variant="outline" className="gap-2" disabled={filtered.length === 0}>
                <Download className="w-4 h-4" /> Export CSV
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search subscribers…" className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="subscribed">Subscribed</SelectItem>
                <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-background rounded-xl border border-border overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="p-16 text-center">
                <Mail className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-1">No subscribers yet</h3>
                <p className="text-sm text-muted-foreground">Subscribers will appear here when users sign up via the newsletter form.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Date Joined</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium text-foreground">{s.email}</TableCell>
                      <TableCell>
                        <button onClick={() => toggleStatus(s.id, s.status)}>
                          <Badge variant={s.status === "subscribed" ? "default" : "secondary"} className="text-xs cursor-pointer capitalize">
                            {s.status}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                        {new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </TableCell>
                      <TableCell>
                        <button onClick={() => setDeleteId(s.id)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            {filtered.length} subscriber{filtered.length !== 1 ? "s" : ""}
            {statusFilter !== "all" && ` (${statusFilter})`}
          </div>
        </TabsContent>

        {/* === SITE NOTICES TAB === */}
        <TabsContent value="notices" className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Site Notices</h2>

          <div className="bg-background rounded-xl border border-border p-6 space-y-4 max-w-2xl">
            <div className="space-y-2">
              <Label>Notice Message</Label>
              <Textarea
                value={noticeMsg}
                onChange={(e) => setNoticeMsg(e.target.value)}
                placeholder="e.g. Happy New Year to all our VBB family! 🎉"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Display Type</Label>
              <Select value={noticeType} onValueChange={setNoticeType}>
                <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Announcement Bar (top of site)</SelectItem>
                  <SelectItem value="email">Email Broadcast (log only)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateNotice} disabled={savingNotice || !noticeMsg.trim()} className="gap-2">
              {savingNotice ? "Publishing…" : <><Megaphone className="w-4 h-4" /> Publish Notice</>}
            </Button>
          </div>

          {notices.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">Active & Past Notices</h3>
              <div className="space-y-2">
                {notices.map((n) => (
                  <div key={n.id} className="flex items-center justify-between bg-background border border-border rounded-lg p-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{n.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs capitalize">{n.type}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(n.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {n.type === "bar" && (
                        <button onClick={() => toggleNoticeActive(n.id, n.is_active)} title={n.is_active ? "Deactivate" : "Activate"}>
                          {n.is_active ? <ToggleRight className="w-6 h-6 text-primary" /> : <ToggleLeft className="w-6 h-6 text-muted-foreground" />}
                        </button>
                      )}
                      <button onClick={() => startEditNotice(n)} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteNotice(n.id)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Edit Notice Dialog */}
          <Dialog open={!!editNoticeId} onOpenChange={(open) => { if (!open) setEditNoticeId(null); }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Notice</DialogTitle>
                <DialogDescription>Update the notice message. Changes apply immediately to the live announcement bar.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  value={editNoticeMsg}
                  onChange={(e) => setEditNoticeMsg(e.target.value)}
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditNoticeId(null)}>Cancel</Button>
                <Button onClick={saveEditNotice} disabled={!editNoticeMsg.trim()}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* === SENT HISTORY TAB === */}
        <TabsContent value="history" className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Sent Newsletters</h2>
          {newsletters.length === 0 ? (
            <div className="p-16 text-center">
              <Send className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-1">No newsletters sent yet</h3>
              <p className="text-sm text-muted-foreground">Sent newsletters will be logged here.</p>
            </div>
          ) : (
            <div className="bg-background rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead className="hidden sm:table-cell">Recipients</TableHead>
                    <TableHead className="hidden sm:table-cell">Sent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {newsletters.map((nl) => (
                    <TableRow key={nl.id}>
                      <TableCell className="font-medium text-foreground">{nl.subject}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs capitalize">{nl.target_audience}</Badge></TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{nl.recipient_count}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                        {new Date(nl.sent_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete subscriber dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove subscriber?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this subscriber from your list.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send Newsletter modal */}
      <Dialog open={showSendModal} onOpenChange={setShowSendModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Newsletter</DialogTitle>
            <DialogDescription>Compose and send a newsletter to your audience.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input value={nlSubject} onChange={(e) => setNlSubject(e.target.value)} placeholder="Newsletter subject…" />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea value={nlContent} onChange={(e) => setNlContent(e.target.value)} placeholder="Write your newsletter content…" rows={6} />
            </div>
            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Select value={nlTarget} onValueChange={setNlTarget}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="subscribers">All Subscribers</SelectItem>
                  <SelectItem value="customers">All Customers</SelectItem>
                  <SelectItem value="both">Both (Subscribers + Customers)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendModal(false)}>Cancel</Button>
            <Button onClick={handleSendNewsletter} disabled={sending} className="gap-2">
              {sending ? "Sending…" : <><Send className="w-4 h-4" /> Send Newsletter</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSubscribers;
