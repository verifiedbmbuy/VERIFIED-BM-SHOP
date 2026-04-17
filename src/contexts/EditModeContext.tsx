import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EditModeContextType {
  isEditMode: boolean;
  isAdmin: boolean;
  pendingChanges: Record<string, string>;
  hasChanges: boolean;
  updateField: (key: string, value: string) => void;
  publishChanges: (slug: string) => Promise<void>;
  discardChanges: () => void;
  saving: boolean;
}

const EditModeContext = createContext<EditModeContextType | undefined>(undefined);

export const useEditMode = () => {
  const ctx = useContext(EditModeContext);
  if (!ctx) return { isEditMode: false, isAdmin: false, pendingChanges: {}, hasChanges: false, updateField: () => {}, publishChanges: async () => {}, discardChanges: () => {}, saving: false };
  return ctx;
};

export const EditModeProvider = ({ children }: { children: ReactNode }) => {
  const [searchParams] = useSearchParams();
  const { role, user } = useAuth();
  const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const isAdmin = role === "admin" || role === "editor";
  const editParam = searchParams.get("edit") === "true";
  const isEditMode = editParam && isAdmin && !!user;

  const updateField = useCallback((key: string, value: string) => {
    setPendingChanges((prev) => ({ ...prev, [key]: value }));
  }, []);

  const hasChanges = Object.keys(pendingChanges).length > 0;

  const publishChanges = useCallback(async (slug: string) => {
    if (!hasChanges) return;
    setSaving(true);
    try {
      // Fetch current content
      const { data } = await supabase
        .from("pages")
        .select("content")
        .eq("slug", slug)
        .single();

      let existing: Record<string, string> = {};
      if (data?.content) {
        try { existing = JSON.parse(data.content); } catch {}
      }

      const merged = { ...existing, ...pendingChanges };
      const { error } = await supabase
        .from("pages")
        .update({ content: JSON.stringify(merged), updated_at: new Date().toISOString() })
        .eq("slug", slug);

      if (error) throw error;
      setPendingChanges({});
      toast.success("Changes published successfully!");
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [hasChanges, pendingChanges]);

  const discardChanges = useCallback(() => {
    setPendingChanges({});
    toast.info("Changes discarded");
  }, []);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (isEditMode && hasChanges) {
      localStorage.setItem("editmode_draft", JSON.stringify(pendingChanges));
    }
  }, [pendingChanges, isEditMode, hasChanges]);

  // Restore draft on mount
  useEffect(() => {
    if (isEditMode) {
      const draft = localStorage.getItem("editmode_draft");
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          if (Object.keys(parsed).length > 0) {
            setPendingChanges(parsed);
          }
        } catch {}
      }
    }
  }, [isEditMode]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (!isEditMode || !hasChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isEditMode, hasChanges]);

  return (
    <EditModeContext.Provider value={{ isEditMode, isAdmin, pendingChanges, hasChanges, updateField, publishChanges, discardChanges, saving }}>
      {children}
    </EditModeContext.Provider>
  );
};
