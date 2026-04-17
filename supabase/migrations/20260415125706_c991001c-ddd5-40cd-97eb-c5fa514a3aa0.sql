
-- Fix chat_sessions: remove overly broad visitor policies
DROP POLICY IF EXISTS "Visitors can view own session by id" ON public.chat_sessions;
DROP POLICY IF EXISTS "Visitors can update own session" ON public.chat_sessions;

-- Fix user_roles: remove overly broad SELECT
DROP POLICY IF EXISTS "Roles viewable by authenticated users" ON public.user_roles;

-- Recreate scoped user_roles SELECT policies
CREATE POLICY "Users can view own role"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
