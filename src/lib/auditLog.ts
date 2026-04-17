import { supabase } from "@/integrations/supabase/client";

export const logAction = async (
  action: string,
  targetType: string,
  targetId?: string,
  targetTitle?: string,
  details?: Record<string, unknown>
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("audit_logs").insert({
      user_id: user.id,
      user_email: user.email || "",
      action,
      target_type: targetType,
      target_id: targetId || null,
      target_title: targetTitle || null,
      details: details || {},
    } as any);
  } catch {
    // Silent fail — don't disrupt user flow
  }
};
