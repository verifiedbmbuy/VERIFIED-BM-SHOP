import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface AuditLog {
  id: string;
  user_email: string;
  action: string;
  target_type: string;
  target_id: string | null;
  target_title: string | null;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  create: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  update: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  delete: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const getActionColor = (action: string) => {
  const lower = action.toLowerCase();
  if (lower.includes("create") || lower.includes("insert")) return ACTION_COLORS.create;
  if (lower.includes("delete") || lower.includes("remove")) return ACTION_COLORS.delete;
  return ACTION_COLORS.update;
};

const ActivityLogsTab = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("audit_logs")
      .select("id, user_email, action, target_type, target_id, target_title, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data) setLogs(data);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      l.target_type.toLowerCase().includes(q) ||
      (l.target_title || "").toLowerCase().includes(q) ||
      l.user_email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-background rounded-xl border border-border p-6 mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Activity Logs</h3>
          <p className="text-xs text-muted-foreground">Track all admin actions across your site.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} className="gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search logs…" className="pl-9" />
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> Loading…
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">No activity logs yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 px-3 font-medium text-muted-foreground">Time</th>
                <th className="py-2 px-3 font-medium text-muted-foreground">User</th>
                <th className="py-2 px-3 font-medium text-muted-foreground">Action</th>
                <th className="py-2 px-3 font-medium text-muted-foreground">Type</th>
                <th className="py-2 px-3 font-medium text-muted-foreground">Target</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                  <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                    {format(new Date(log.created_at), "MMM d, HH:mm")}
                  </td>
                  <td className="py-2.5 px-3 text-foreground truncate max-w-[180px]">{log.user_email}</td>
                  <td className="py-2.5 px-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge variant="outline" className="text-xs capitalize">{log.target_type}</Badge>
                  </td>
                  <td className="py-2.5 px-3 text-foreground truncate max-w-[200px]">{log.target_title || log.target_id || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ActivityLogsTab;
