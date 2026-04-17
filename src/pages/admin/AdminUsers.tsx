import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Plus,
  Search,
  Pencil,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCog,
  X,
  Loader2,
  Copy,
  RefreshCw,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type AppRole = "admin" | "editor" | "author";

interface UserRow {
  id: string;
  full_name: string;
  avatar_url: string | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  email: string;
  role: AppRole;
  provider: string;
}

const ROLE_CONFIG: Record<AppRole, { label: string; icon: typeof Shield; color: string; description: string }> = {
  admin: {
    label: "Administrator",
    icon: ShieldCheck,
    color: "bg-primary/10 text-primary border-primary/20",
    description: "Full access to everything",
  },
  editor: {
    label: "Editor",
    icon: ShieldAlert,
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    description: "Posts, Pages & Media",
  },
  author: {
    label: "Author",
    icon: Shield,
    color: "bg-secondary text-muted-foreground border-border",
    description: "Own posts only",
  },
};

const generatePassword = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let pw = "";
  for (let i = 0; i < 16; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
};

const AdminUsers = () => {
  const { user: currentUser, role: currentRole } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [slideOpen, setSlideOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);

  // New user form
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("author");
  const [creating, setCreating] = useState(false);
  const [emailError, setEmailError] = useState(false);

  // Role change confirmation
  const [roleChangeTarget, setRoleChangeTarget] = useState<{ userId: string; newRole: AppRole } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !profiles) {
      setLoading(false);
      return;
    }

    const { data: roles } = await supabase.from("user_roles").select("user_id, role");

    const roleMap = new Map<string, AppRole>();
    (roles || []).forEach((r: any) => roleMap.set(r.user_id, r.role as AppRole));

    const userRows: UserRow[] = profiles.map((p: any) => ({
      id: p.id,
      full_name: p.full_name || "Unknown",
      avatar_url: p.avatar_url,
      is_active: p.is_active ?? true,
      last_login: p.last_login,
      created_at: p.created_at,
      email: p.email || "No email",
      role: roleMap.get(p.id) || "author",
      provider: p.provider || "email",
    }));

    setUsers(userRows);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleCreateUser = async () => {
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      toast.error("All fields are required.");
      return;
    }
    if (!validateEmail(newEmail)) {
      setEmailError(true);
      toast.error("Please enter a valid email address.");
      return;
    }

    setCreating(true);

    // Sign up user via Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: newEmail,
      password: newPassword,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: newName },
      },
    });

    if (error) {
      toast.error(error.message);
      setCreating(false);
      return;
    }

    // If role isn't the default 'author', update it
    if (data.user && newRole !== "author") {
      await supabase.from("user_roles").update({ role: newRole }).eq("user_id", data.user.id);
    }

    // Update profile name
    if (data.user) {
      await supabase.from("profiles").update({ full_name: newName }).eq("id", data.user.id);
    }

    toast.success(`User "${newName}" invited successfully!`);
    setCreating(false);
    setSlideOpen(false);
    setNewName("");
    setNewEmail("");
    setNewPassword("");
    setNewRole("author");
    fetchUsers();
  };

  const handleToggleActive = async (userId: string, active: boolean) => {
    if (userId === currentUser?.id) {
      toast.error("You cannot deactivate your own account.");
      return;
    }
    await supabase.from("profiles").update({ is_active: active }).eq("id", userId);
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_active: active } : u)));
    toast.success(`User ${active ? "activated" : "deactivated"}.`);
  };

  const handleRoleChange = async () => {
    if (!roleChangeTarget) return;
    const { userId, newRole: nr } = roleChangeTarget;

    if (userId === currentUser?.id && nr !== "admin") {
      toast.error("You cannot downgrade your own admin role. This would lock you out.");
      setRoleChangeTarget(null);
      return;
    }

    await supabase.from("user_roles").update({ role: nr }).eq("user_id", userId);
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: nr } : u)));
    toast.success("Role updated.");
    setRoleChangeTarget(null);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (currentRole !== "admin") {
    return (
      <div className="p-16 text-center">
        <ShieldAlert className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-1">Access Denied</h3>
        <p className="text-sm text-muted-foreground">Only administrators can manage users.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Users</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{users.length} total users</p>
        </div>
        <Button onClick={() => setSlideOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users…" className="pl-9" />
      </div>

      {/* Role Legend */}
      <div className="flex flex-wrap gap-4">
        {(Object.entries(ROLE_CONFIG) as [AppRole, typeof ROLE_CONFIG["admin"]][]).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-2 text-xs text-muted-foreground">
            <cfg.icon className="w-4 h-4" />
            <span className="font-medium">{cfg.label}</span>
            <span>— {cfg.description}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-background rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> Loading users…
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No users found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Provider</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="hidden lg:table-cell">Last Login</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u) => {
                const roleCfg = ROLE_CONFIG[u.role];
                const isSelf = u.id === currentUser?.id;

                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                          {u.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            {u.full_name}
                            {isSelf && <span className="text-xs text-muted-foreground ml-1">(you)</span>}
                          </p>
                          <p className="text-xs text-muted-foreground sm:hidden">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {u.provider === "google" ? (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                          Google
                        </div>
                      ) : u.provider === "apple" ? (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                          Apple
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Mail className="w-3.5 h-3.5" />
                          Email
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs gap-1", roleCfg.color)}>
                        <roleCfg.icon className="w-3 h-3" />
                        {roleCfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", u.is_active ? "bg-green-500" : "bg-muted-foreground/30")} />
                        <span className="text-sm text-muted-foreground">{u.is_active ? "Active" : "Inactive"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {u.last_login
                        ? new Date(u.last_login).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingUser(u)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          title="Edit user"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <Switch
                          checked={u.is_active}
                          onCheckedChange={(v) => handleToggleActive(u.id, v)}
                          disabled={isSelf}
                          className="scale-75"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Add User Slide-over */}
      {slideOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-foreground/50" onClick={() => setSlideOpen(false)} />
          <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-background border-l border-border shadow-xl overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Add New User</h3>
                <button onClick={() => setSlideOpen(false)} className="p-2 rounded-lg hover:bg-accent text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="John Doe" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => { setNewEmail(e.target.value); setEmailError(false); }}
                    placeholder="john@example.com"
                    className={cn(emailError && "border-destructive")}
                  />
                  {emailError && <p className="text-xs text-destructive mt-1">Please enter a valid email.</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const pw = generatePassword();
                        setNewPassword(pw);
                        navigator.clipboard.writeText(pw);
                        toast.success("Strong password generated and copied!");
                      }}
                      title="Generate strong password"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                  {newPassword && (
                    <button
                      onClick={() => { navigator.clipboard.writeText(newPassword); toast.success("Copied!"); }}
                      className="flex items-center gap-1 text-xs text-primary mt-1 hover:underline"
                    >
                      <Copy className="w-3 h-3" /> Copy password
                    </button>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Role</label>
                  <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator — Full access</SelectItem>
                      <SelectItem value="editor">Editor — Posts, Pages & Media</SelectItem>
                      <SelectItem value="author">Author — Own posts only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setSlideOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleCreateUser} disabled={creating} className="flex-1 gap-2">
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Add User
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <>
          <div className="fixed inset-0 z-50 bg-foreground/50" onClick={() => setEditingUser(null)} />
          <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-background border-l border-border shadow-xl overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Edit User</h3>
                <button onClick={() => setEditingUser(null)} className="p-2 rounded-lg hover:bg-accent text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-bold">
                    {editingUser.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{editingUser.full_name}</p>
                    <p className="text-sm text-muted-foreground">{editingUser.email}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Role</label>
                  <Select
                    value={editingUser.role}
                    onValueChange={(v) => {
                      const newR = v as AppRole;
                      if (editingUser.id === currentUser?.id && newR !== "admin") {
                        toast.error("You cannot downgrade your own admin role.");
                        return;
                      }
                      setRoleChangeTarget({ userId: editingUser.id, newRole: newR });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="author">Author</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Active Status</p>
                    <p className="text-xs text-muted-foreground">Inactive users cannot log in</p>
                  </div>
                  <Switch
                    checked={editingUser.is_active}
                    onCheckedChange={(v) => {
                      if (editingUser.id === currentUser?.id) {
                        toast.error("You cannot deactivate your own account.");
                        return;
                      }
                      handleToggleActive(editingUser.id, v);
                      setEditingUser({ ...editingUser, is_active: v });
                    }}
                    disabled={editingUser.id === currentUser?.id}
                  />
                </div>
              </div>

              <Button variant="outline" onClick={() => setEditingUser(null)} className="w-full">
                Done
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Role Change Confirmation */}
      <AlertDialog open={!!roleChangeTarget} onOpenChange={() => setRoleChangeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change user role?</AlertDialogTitle>
            <AlertDialogDescription>
              This will update the user's permissions immediately. They may lose access to certain sections.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleChange}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;
