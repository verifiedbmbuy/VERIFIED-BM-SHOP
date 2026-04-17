import { useState, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { ClipboardList, Plus, GripVertical, User, Clock, Trash2, Tag, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const TEAM_MEMBERS = ["Akhi Vai", "Shopon", "Tasneem", "Maruf"];

type KanbanStatus = "todo" | "in_progress" | "review" | "done";

interface KanbanCard {
  id: string;
  title: string;
  description: string;
  assignee: string;
  status: KanbanStatus;
  created_at: string;
  source?: string;
  priority?: string;
}

interface WorkLogEntry {
  id: string;
  member: string;
  hours: number;
  notes: string;
  log_date: string;
}

const COLUMNS: { key: KanbanStatus; label: string; color: string; bg: string }[] = [
  { key: "todo", label: "To-Do", color: "border-t-gray-400 dark:border-t-gray-500", bg: "bg-gray-50 dark:bg-gray-800/40" },
  { key: "in_progress", label: "In Progress", color: "border-t-[#2271b1]", bg: "bg-blue-50/50 dark:bg-blue-900/10" },
  { key: "review", label: "Under Review", color: "border-t-amber-400", bg: "bg-amber-50/50 dark:bg-amber-900/10" },
  { key: "done", label: "Done", color: "border-t-green-500", bg: "bg-green-50/50 dark:bg-green-900/10" },
];

const AdminTaskBoard = () => {
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<KanbanStatus | null>(null);
  const [addingTo, setAddingTo] = useState<KanbanStatus | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [logMember, setLogMember] = useState("");
  const [logHours, setLogHours] = useState("");
  const [logNotes, setLogNotes] = useState("");
  const [animated, setAnimated] = useState(false);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setCards(data.map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description || "",
        assignee: t.assignee || "",
        status: t.status as KanbanStatus,
        created_at: t.created_at,
        source: t.source || "",
        priority: t.priority || "normal",
      })));
    }
    setLoading(false);
  }, []);

  // Fetch work logs
  const fetchWorkLogs = useCallback(async () => {
    const { data, error } = await supabase
      .from("work_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && data) {
      setWorkLogs(data.map((l: any) => ({
        id: l.id,
        member: l.member,
        hours: Number(l.hours),
        notes: l.notes || "",
        log_date: l.log_date,
      })));
    }
    setLogsLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchWorkLogs();
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, [fetchTasks, fetchWorkLogs]);

  // Realtime subscriptions
  useEffect(() => {
    const tasksChannel = supabase
      .channel("tasks-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
        fetchTasks();
      })
      .subscribe();

    const logsChannel = supabase
      .channel("work-logs-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "work_logs" }, () => {
        fetchWorkLogs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(logsChannel);
    };
  }, [fetchTasks, fetchWorkLogs]);

  // Drag handlers
  const handleDragStart = (cardId: string) => setDraggedCard(cardId);

  const handleDragOver = (e: React.DragEvent, col: KanbanStatus) => {
    e.preventDefault();
    setDragOverCol(col);
  };

  const handleDragLeave = () => setDragOverCol(null);

  const handleDrop = async (col: KanbanStatus) => {
    if (draggedCard) {
      // Optimistic update
      setCards((prev) => prev.map((c) => (c.id === draggedCard ? { ...c, status: col } : c)));
      const { error } = await supabase.from("tasks").update({ status: col }).eq("id", draggedCard);
      if (error) {
        toast({ title: "Error", description: "Failed to move task", variant: "destructive" });
        fetchTasks();
      } else {
        toast({ title: "Card Moved", description: `Task moved to ${COLUMNS.find((c) => c.key === col)?.label}` });
      }
    }
    setDraggedCard(null);
    setDragOverCol(null);
  };

  const handleDragEnd = () => {
    setDraggedCard(null);
    setDragOverCol(null);
  };

  const addCard = async (status: KanbanStatus) => {
    if (!newTitle.trim()) return;
    const { error } = await supabase.from("tasks").insert({
      title: newTitle,
      description: newDesc,
      assignee: newAssignee,
      status,
      priority: "normal",
    });
    if (error) {
      toast({ title: "Error", description: "Failed to create task", variant: "destructive" });
    } else {
      toast({ title: "Task Created", description: `"${newTitle}" added to ${COLUMNS.find((c) => c.key === status)?.label}` });
    }
    setNewTitle("");
    setNewDesc("");
    setNewAssignee("");
    setAddingTo(null);
  };

  const deleteCard = async (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete task", variant: "destructive" });
      fetchTasks();
    }
  };

  const addWorkLog = async () => {
    if (!logMember || !logHours) return;
    const { error } = await supabase.from("work_logs").insert({
      member: logMember,
      hours: parseFloat(logHours) || 0,
      notes: logNotes,
    });
    if (error) {
      toast({ title: "Error", description: "Failed to log hours", variant: "destructive" });
    } else {
      toast({ title: "Work Log Added", description: `${logHours}h logged for ${logMember}` });
    }
    setLogMember("");
    setLogHours("");
    setLogNotes("");
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="space-y-6">
      <Helmet><title>Task Board — Admin</title></Helmet>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Task Board</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage team tasks with real-time sync</p>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((col, ci) => {
          const colCards = cards.filter((c) => c.status === col.key);
          return (
            <div
              key={col.key}
              onDragOver={(e) => handleDragOver(e, col.key)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(col.key)}
              className={cn(
                "rounded-xl border-t-4 border border-gray-200 dark:border-gray-700 min-h-[300px] flex flex-col transition-all duration-500",
                col.color,
                col.bg,
                dragOverCol === col.key && "ring-2 ring-[#2271b1] ring-offset-2 scale-[1.01]",
                animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              )}
              style={{ transitionDelay: `${ci * 100}ms` }}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{col.label}</h3>
                  <span className="text-[10px] bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full px-2 py-0.5 font-bold">
                    {colCards.length}
                  </span>
                </div>
                <button
                  onClick={() => setAddingTo(addingTo === col.key ? null : col.key)}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-500 dark:text-gray-400"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Add Form */}
              {addingTo === col.key && (
                <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-700 space-y-2 animate-scale-in">
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Task title..."
                    className="h-8 text-xs"
                  />
                  <Textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Description (optional)"
                    className="text-xs min-h-[50px] resize-none"
                  />
                  <Select value={newAssignee} onValueChange={setNewAssignee}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Assign to..." />
                    </SelectTrigger>
                    <SelectContent>
                      {TEAM_MEMBERS.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button size="sm" className="h-7 text-xs bg-[#2271b1] hover:bg-[#135e96] flex-1" onClick={() => addCard(col.key)}>
                      Add Card
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAddingTo(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Cards */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(2)].map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <>
                    {colCards.map((card) => (
                      <div
                        key={card.id}
                        draggable
                        onDragStart={() => handleDragStart(card.id)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 cursor-grab active:cursor-grabbing",
                          "shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5",
                          draggedCard === card.id && "opacity-40 scale-95 rotate-1"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <GripVertical className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 shrink-0" />
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">{card.title}</p>
                          </div>
                          <button onClick={() => deleteCard(card.id)} className="p-0.5 text-gray-300 hover:text-red-500 transition-colors shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {card.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 ml-5 line-clamp-2">{card.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2.5 ml-5 flex-wrap">
                          {card.assignee && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-[#2271b1]/10 text-[#2271b1] dark:bg-[#2271b1]/20 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                              <User className="w-2.5 h-2.5" /> {card.assignee}
                            </span>
                          )}
                          {card.priority === "critical" && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-semibold">
                              <Tag className="w-2.5 h-2.5" /> Critical
                            </span>
                          )}
                          {card.source && (
                            <span className="text-[10px] text-gray-400 dark:text-gray-500">{card.source}</span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 ml-5 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> {timeAgo(card.created_at)}
                        </p>
                      </div>
                    ))}
                    {colCards.length === 0 && (
                      <div className="text-center py-8 text-gray-300 dark:text-gray-600">
                        <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">Drop tasks here</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Daily Work Log */}
      <div
        className={cn(
          "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 transition-all duration-500",
          animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        )}
        style={{ transitionDelay: "500ms" }}
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Daily Work Log</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Track team hours and daily accomplishments</p>
        </div>

        {/* Quick Entry */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-end gap-3">
          <div className="space-y-1 min-w-[140px]">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Team Member</label>
            <Select value={logMember} onValueChange={setLogMember}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {TEAM_MEMBERS.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 w-20">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Hours</label>
            <Input
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={logHours}
              onChange={(e) => setLogHours(e.target.value)}
              placeholder="8"
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1 flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Notes</label>
            <Input
              value={logNotes}
              onChange={(e) => setLogNotes(e.target.value)}
              placeholder="What was accomplished today..."
              className="h-9 text-xs"
            />
          </div>
          <Button size="sm" className="h-9 bg-[#2271b1] hover:bg-[#135e96] text-xs" onClick={addWorkLog} disabled={!logMember || !logHours}>
            Log Hours
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-6 py-3">Date</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-6 py-3">Team Member</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-6 py-3">Hours</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-6 py-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {logsLoading ? (
                <>
                  {[...Array(3)].map((_, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="px-6 py-3"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-6 py-3"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-3"><Skeleton className="h-4 w-12" /></td>
                      <td className="px-6 py-3"><Skeleton className="h-4 w-40" /></td>
                    </tr>
                  ))}
                </>
              ) : workLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">
                    No work logs yet. Start logging hours above.
                  </td>
                </tr>
              ) : (
                workLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">{log.log_date}</td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                        <User className="w-3.5 h-3.5 text-[#2271b1]" /> {log.member}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                        <Clock className="w-3.5 h-3.5 text-gray-400" /> {log.hours}h
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-[300px] truncate">{log.notes || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminTaskBoard;
