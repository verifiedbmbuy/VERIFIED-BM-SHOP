import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type AppRole = "admin" | "editor" | "author";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: { id: string; full_name: string; avatar_url: string | null; is_active: boolean } | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  canAccess: (section: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

// Permission matrix
const PERMISSIONS: Record<AppRole, string[]> = {
  admin: ["dashboard", "posts", "pages", "media", "settings", "users", "finance"],
  editor: ["dashboard", "posts", "pages", "media"],
  author: ["dashboard", "posts"],
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndRole = async (userId: string) => {
    const [profileRes, roleRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, avatar_url, is_active").eq("id", userId).single(),
      supabase.from("user_roles").select("role").eq("user_id", userId).single(),
    ]);

    if (profileRes.data) setProfile(profileRes.data);
    if (roleRes.data) setRole(roleRes.data.role as AppRole);

    // Update last_login
    await supabase.from("profiles").update({ last_login: new Date().toISOString() }).eq("id", userId);
  };

  useEffect(() => {
    let isMounted = true;

    // Listener for ONGOING auth changes (does NOT control initial loading)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Use setTimeout to avoid Supabase deadlock
        setTimeout(() => fetchProfileAndRole(session.user.id), 0);
      } else {
        setProfile(null);
        setRole(null);
      }
    });

    // INITIAL load — fetch role BEFORE setting loading to false
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfileAndRole(session.user.id);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message || null };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isNetworkError = /failed to fetch|networkerror|network request failed/i.test(message);

      if (isNetworkError) {
        return {
          error:
            "Network error while contacting the auth server. Check internet/firewall/ad-blocker and verify Supabase URL settings.",
        };
      }

      return { error: message || "Unable to sign in right now." };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    window.location.href = "/";
  };

  const hasRole = (r: AppRole) => role === r;
  const canAccess = (section: string) => {
    if (!role) return false;
    return PERMISSIONS[role]?.includes(section) ?? false;
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, role, loading, signIn, signOut, hasRole, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
};
