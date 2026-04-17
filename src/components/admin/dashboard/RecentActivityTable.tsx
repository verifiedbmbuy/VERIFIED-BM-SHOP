import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Edit, ChevronDown, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

interface ActivityRow {
  id: string;
  date: Date;
  status: string;
  teamMember: string;
  title: string;
  type: "post" | "order" | "comment";
  editLink: string;
  sourceTable: string;
}

const TEAM_MEMBERS = ["Akhi Vai", "Shopon", "Tasneem", "Maruf"];

const STATUS_OPTIONS = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "verified", label: "Verified" },
  { value: "restricted", label: "Restricted" },
];

const statusStyles: Record<string, string> = {
  published: "bg-green-100 text-green-700",
  completed: "bg-green-100 text-green-700",
  approved: "bg-green-100 text-green-700",
  verified: "bg-emerald-100 text-emerald-700",
  draft: "bg-gray-100 text-gray-600",
  pending: "bg-yellow-100 text-yellow-700",
  restricted: "bg-red-100 text-red-700",
};

const StatusDropdown = ({
  currentStatus,
  onStatusChange,
}: {
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize cursor-pointer transition-all hover:ring-2 hover:ring-[#2271b1]/20",
          statusStyles[currentStatus] || "bg-gray-100 text-gray-600"
        )}
      >
        {currentStatus}
        <ChevronDown className="w-2.5 h-2.5" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onStatusChange(opt.value);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors flex items-center gap-2",
                currentStatus === opt.value && "font-semibold"
              )}
            >
              <span className={cn(
                "w-2 h-2 rounded-full shrink-0",
                statusStyles[opt.value]?.includes("green") || statusStyles[opt.value]?.includes("emerald") ? "bg-green-500" :
                statusStyles[opt.value]?.includes("red") ? "bg-red-500" :
                statusStyles[opt.value]?.includes("yellow") ? "bg-yellow-500" : "bg-gray-400"
              )} />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const RecentActivityTable = () => {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberFilter, setMemberFilter] = useState<string>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    if (filterOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [filterOpen]);

  useEffect(() => {
    const load = async () => {
      const [postsRes, ordersRes, commentsRes] = await Promise.all([
        supabase.from("blog_posts").select("id, title, status, author, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("orders").select("id, customer_name, status, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("comments").select("id, author_name, status, content, created_at").order("created_at", { ascending: false }).limit(5),
      ]);

      const items: ActivityRow[] = [];

      (postsRes.data || []).forEach((p: any) => {
        items.push({
          id: p.id,
          date: new Date(p.created_at),
          status: p.status || "draft",
          teamMember: p.author || TEAM_MEMBERS[Math.floor(Math.random() * TEAM_MEMBERS.length)],
          title: p.title,
          type: "post",
          editLink: `/admin/posts/${p.id}/edit`,
          sourceTable: "blog_posts",
        });
      });

      (ordersRes.data || []).forEach((o: any) => {
        items.push({
          id: o.id,
          date: new Date(o.created_at),
          status: o.status || "pending",
          teamMember: TEAM_MEMBERS[Math.floor(Math.random() * TEAM_MEMBERS.length)],
          title: `Order #${o.id.slice(0, 8)}`,
          type: "order",
          editLink: "/admin/orders",
          sourceTable: "orders",
        });
      });

      (commentsRes.data || []).forEach((c: any) => {
        items.push({
          id: c.id,
          date: new Date(c.created_at),
          status: c.status || "pending",
          teamMember: c.author_name || TEAM_MEMBERS[Math.floor(Math.random() * TEAM_MEMBERS.length)],
          title: (c.content?.slice(0, 50) || "Comment") + "…",
          type: "comment",
          editLink: "/admin/comments",
          sourceTable: "comments",
        });
      });

      items.sort((a, b) => b.date.getTime() - a.date.getTime());
      setRows(items.slice(0, 10));
      setLoading(false);
    };
    load();
  }, []);

  const handleStatusChange = async (rowId: string, newStatus: string) => {
    // Optimistic update
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, status: newStatus } : r))
    );

    const row = rows.find((r) => r.id === rowId);
    if (!row) return;

    // Persist to DB
    const { error } = await supabase
      .from(row.sourceTable as any)
      .update({ status: newStatus } as any)
      .eq("id", rowId);

    if (error) {
      toast.error("Failed to update status");
      // Revert
      setRows((prev) =>
        prev.map((r) => (r.id === rowId ? { ...r, status: row.status } : r))
      );
    } else {
      toast.success(`Status updated to "${newStatus}"`);
    }
  };

  const filteredRows = memberFilter === "all"
    ? rows
    : rows.filter((r) => r.teamMember === memberFilter);

  return (
    <div className="bg-white rounded-lg border border-[#dcdcde] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#dcdcde] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>

        {/* Team Member Filter */}
        <div ref={filterRef} className="relative">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
              memberFilter !== "all"
                ? "border-[#2271b1] bg-[#2271b1]/5 text-[#2271b1]"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            )}
          >
            <Filter className="w-3 h-3" />
            {memberFilter === "all" ? "All Members" : memberFilter}
            <ChevronDown className="w-3 h-3" />
          </button>
          {filterOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
              <button
                onClick={() => { setMemberFilter("all"); setFilterOpen(false); }}
                className={cn("w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors", memberFilter === "all" && "font-semibold text-[#2271b1]")}
              >
                All Members
              </button>
              {TEAM_MEMBERS.map((name) => (
                <button
                  key={name}
                  onClick={() => { setMemberFilter(name); setFilterOpen(false); }}
                  className={cn("w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors", memberFilter === name && "font-semibold text-[#2271b1]")}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-5 space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : filteredRows.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-10">
          {memberFilter !== "all" ? `No activity for ${memberFilter}` : "No activity yet"}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f6f7f7] text-gray-500 text-xs">
                <th className="text-left px-4 py-2.5 font-medium">Date</th>
                <th className="text-left px-4 py-2.5 font-medium">Title</th>
                <th className="text-left px-4 py-2.5 font-medium">Status</th>
                <th className="text-left px-4 py-2.5 font-medium">Team Member</th>
                <th className="text-right px-4 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id} className="border-t border-[#f0f0f1] hover:bg-[#f6f7f7] transition-colors">
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {format(row.date, "MMM dd, yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <Link to={row.editLink} className="text-[#2271b1] hover:text-[#135e96] font-medium text-xs">
                      {row.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <StatusDropdown
                      currentStatus={row.status}
                      onStatusChange={(newStatus) => handleStatusChange(row.id, newStatus)}
                    />
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{row.teamMember}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to={row.editLink} className="p-1 rounded text-gray-400 hover:text-[#2271b1] hover:bg-[#2271b1]/5 transition-colors inline-flex">
                      <Edit className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RecentActivityTable;
