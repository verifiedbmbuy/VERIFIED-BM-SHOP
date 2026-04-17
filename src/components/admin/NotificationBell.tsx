import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ShoppingCart, Users, HeadphonesIcon, CheckCheck, AlertTriangle, Shield, Globe, UserPlus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

interface SystemAlert {
  id: string;
  title: string;
  message: string;
  type: "restricted_asset" | "low_score";
  severity: "critical" | "warning";
  source_id?: string;
  created_at: string;
  is_read: boolean;
  delegated_to?: string;
}

const TEAM_MEMBERS = ["Akhi Vai", "Shopon", "Tasneem", "Maruf"];

const typeIcons: Record<string, typeof ShoppingCart> = {
  order: ShoppingCart,
  user: Users,
  support: HeadphonesIcon,
  restricted_asset: Shield,
  low_score: Globe,
};

const typeColors: Record<string, string> = {
  order: "bg-[#2271b1]/10 text-[#2271b1]",
  user: "bg-[hsl(142,70%,45%)]/10 text-[hsl(142,70%,45%)]",
  support: "bg-[hsl(45,93%,47%)]/10 text-[hsl(45,93%,47%)]",
  restricted_asset: "bg-red-500/10 text-red-500",
  low_score: "bg-amber-500/10 text-amber-500",
};

const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [open, setOpen] = useState(false);
  const [delegateOpen, setDelegateOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<SystemAlert | null>(null);
  const [selectedMember, setSelectedMember] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "alerts">("all");

  const unreadNotifs = notifications.filter((n) => !n.is_read).length;
  const unreadAlerts = systemAlerts.filter((a) => !a.is_read).length;
  const totalUnread = unreadNotifs + unreadAlerts;
  const hasCritical = systemAlerts.some((a) => a.severity === "critical" && !a.is_read);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setNotifications(data as Notification[]);
  }, [user]);

  // Watch assets for restricted status
  const generateAssetAlerts = useCallback(async () => {
    const { data: assets } = await supabase
      .from("assets")
      .select("*")
      .eq("status", "Restricted");

    if (assets) {
      const newAlerts: SystemAlert[] = assets.map((asset) => ({
        id: `asset-${asset.id}`,
        title: "Restricted Asset Detected",
        message: `"${asset.name}" (${asset.type}) has been restricted.`,
        type: "restricted_asset" as const,
        severity: "critical" as const,
        source_id: asset.id,
        created_at: asset.updated_at || asset.created_at,
        is_read: false,
        delegated_to: undefined,
      }));

      setSystemAlerts((prev) => {
        const existing = new Set(prev.map((a) => a.id));
        const fresh = newAlerts.filter((a) => !existing.has(a.id));
        // Preserve read/delegate state for existing alerts
        const updated = prev.map((p) => {
          const match = newAlerts.find((n) => n.id === p.id);
          return match ? { ...p, message: match.message, title: match.title } : p;
        });
        // Remove alerts for assets no longer restricted
        const activeIds = new Set(newAlerts.map((a) => a.id));
        const filtered = updated.filter((a) => a.type !== "restricted_asset" || activeIds.has(a.id));
        return [...fresh, ...filtered];
      });
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    generateAssetAlerts();
    const interval = setInterval(() => {
      fetchNotifications();
      generateAssetAlerts();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications, generateAssetAlerts]);

  // Realtime listener for DB notifications
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("admin-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => fetchNotifications())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "notifications" }, () => fetchNotifications())
      .on("postgres_changes", { event: "*", schema: "public", table: "assets" }, () => generateAssetAlerts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchNotifications, generateAssetAlerts]);

  const markAllRead = async () => {
    if (!user) return;
    if (activeTab === "all") {
      const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
      if (unreadIds.length) {
        await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      }
    } else {
      setSystemAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    }
  };

  const handleNotifClick = async (notif: Notification) => {
    if (!notif.is_read) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", notif.id);
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)));
    }
    setOpen(false);
    if (notif.link) navigate(notif.link);
  };

  const handleDismissNotification = async (notif: Notification) => {
    await supabase.from("notifications").delete().eq("id", notif.id);
    setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
  };

  const handleAlertClick = (alert: SystemAlert) => {
    setSystemAlerts((prev) => prev.map((a) => (a.id === alert.id ? { ...a, is_read: true } : a)));
    if (alert.type === "restricted_asset") {
      setOpen(false);
      navigate("/admin/assets");
    }
  };

  const handleDismissAlert = (alert: SystemAlert) => {
    setSystemAlerts((prev) => prev.filter((a) => a.id !== alert.id));
  };

  const openDelegate = (alert: SystemAlert) => {
    setSelectedAlert(alert);
    setSelectedMember("");
    setDelegateOpen(true);
  };

  const handleDelegate = () => {
    if (!selectedAlert || !selectedMember) return;
    setSystemAlerts((prev) =>
      prev.map((a) => (a.id === selectedAlert.id ? { ...a, delegated_to: selectedMember, is_read: true } : a))
    );
    // Push task to Kanban board via localStorage
    const kanbanTask = {
      id: `delegated-${selectedAlert.id}-${Date.now()}`,
      title: selectedAlert.title,
      description: selectedAlert.message,
      assignee: selectedMember,
      status: "todo",
      created_at: new Date().toISOString(),
      source: "Alert Center",
      priority: selectedAlert.severity === "critical" ? "critical" : "normal",
    };
    try {
      const existing = JSON.parse(localStorage.getItem("vbb_kanban_tasks") || "[]");
      localStorage.setItem("vbb_kanban_tasks", JSON.stringify([kanbanTask, ...existing]));
      // Trigger storage event for other tabs/components
      localStorage.setItem("vbb_delegated_task", JSON.stringify(kanbanTask));
    } catch { /* ignore */ }
    toast({
      title: "Task Delegated & Added to Board",
      description: `Assigned to ${selectedMember} — card added to Task Board`,
    });
    setDelegateOpen(false);
    setSelectedAlert(null);
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
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors relative">
            <Bell className="w-5 h-5" />
            {totalUnread > 0 && (
              <span className={cn(
                "absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white",
                hasCritical ? "bg-red-500 animate-pulse" : "bg-[#2271b1]"
              )}>
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
            {hasCritical && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping opacity-75" />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-80 sm:w-[420px] p-0 bg-white border border-gray-200 shadow-xl rounded-xl z-[100] animate-scale-in"
        >
          {/* Tabs */}
          <div className="flex items-center border-b border-gray-200">
            <button
              onClick={() => setActiveTab("all")}
              className={cn(
                "flex-1 px-4 py-3 text-xs font-semibold transition-colors",
                activeTab === "all"
                  ? "text-[#2271b1] border-b-2 border-[#2271b1]"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Notifications {unreadNotifs > 0 && `(${unreadNotifs})`}
            </button>
            <button
              onClick={() => setActiveTab("alerts")}
              className={cn(
                "flex-1 px-4 py-3 text-xs font-semibold transition-colors relative",
                activeTab === "alerts"
                  ? "text-red-500 border-b-2 border-red-500"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Critical Alerts {unreadAlerts > 0 && `(${unreadAlerts})`}
              {hasCritical && (
                <span className="absolute top-2 ml-1 w-2 h-2 bg-red-500 rounded-full animate-pulse inline-block" />
              )}
            </button>
          </div>

          {/* Mark all read */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
            <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-[#2271b1] hover:underline font-medium">
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
            <button onClick={() => setOpen(false)} className="text-xs text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Close
            </button>
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {activeTab === "all" ? (
              notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const Icon = typeIcons[notif.type] || Bell;
                  const color = typeColors[notif.type] || "bg-gray-100 text-gray-500";
                  return (
                    <div
                      key={notif.id}
                      className={cn(
                        "flex items-start gap-3 w-full px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0",
                        !notif.is_read && "bg-blue-50/50"
                      )}
                    >
                      <button
                        onClick={() => handleNotifClick(notif)}
                        className="flex-1 flex items-start gap-3 text-left"
                      >
                        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5", color)}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={cn("text-sm truncate", !notif.is_read ? "font-semibold text-gray-900" : "text-gray-700")}>{notif.title}</p>
                            {!notif.is_read && <span className="w-2 h-2 bg-[#2271b1] rounded-full shrink-0" />}
                          </div>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{notif.message}</p>
                          <p className="text-[11px] text-gray-400 mt-1">{timeAgo(notif.created_at)}</p>
                        </div>
                      </button>
                      <button
                        onClick={() => handleDismissNotification(notif)}
                        className="text-gray-400 hover:text-gray-700 p-1 rounded-full"
                        aria-label="Dismiss notification"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )
            ) : (
              systemAlerts.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <AlertTriangle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No critical alerts</p>
                  <p className="text-xs text-gray-300 mt-1">System is healthy</p>
                </div>
              ) : (
                systemAlerts.map((alert) => {
                  const Icon = typeIcons[alert.type] || AlertTriangle;
                  const color = typeColors[alert.type] || "bg-red-500/10 text-red-500";
                  return (
                    <div
                      key={alert.id}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-0 transition-colors",
                        !alert.is_read && "bg-red-50/40"
                      )}
                    >
                      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 relative", color)}>
                        <Icon className="w-4 h-4" />
                        {!alert.is_read && alert.severity === "critical" && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn("text-sm", !alert.is_read ? "font-semibold text-gray-900" : "text-gray-700")}>{alert.title}</p>
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase",
                            alert.severity === "critical" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                          )}>
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{alert.message}</p>
                        {alert.delegated_to && (
                          <p className="text-xs text-[#2271b1] mt-1 flex items-center gap-1">
                            <UserPlus className="w-3 h-3" /> Assigned to {alert.delegated_to}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => handleAlertClick(alert)}
                            className="text-[11px] font-medium text-[#2271b1] hover:underline"
                          >
                            View
                          </button>
                          {!alert.delegated_to && (
                            <button
                              onClick={() => openDelegate(alert)}
                              className="text-[11px] font-medium text-gray-500 hover:text-gray-700 flex items-center gap-1"
                            >
                              <UserPlus className="w-3 h-3" /> Delegate
                            </button>
                          )}
                          <button
                            onClick={() => handleDismissAlert(alert)}
                            className="text-[11px] font-medium text-gray-500 hover:text-gray-700"
                          >
                            Dismiss
                          </button>
                          <span className="text-[11px] text-gray-400 ml-auto">{timeAgo(alert.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Delegate Modal */}
      <Dialog open={delegateOpen} onOpenChange={setDelegateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Delegate Alert</DialogTitle>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-900">{selectedAlert.title}</p>
                <p className="text-xs text-gray-500 mt-1">{selectedAlert.message}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Assign to Team Member</label>
                <Select value={selectedMember} onValueChange={setSelectedMember}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAM_MEMBERS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setDelegateOpen(false)}>Cancel</Button>
                <Button size="sm" onClick={handleDelegate} disabled={!selectedMember} className="bg-[#2271b1] hover:bg-[#135e96]">
                  Assign Task
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NotificationBell;
