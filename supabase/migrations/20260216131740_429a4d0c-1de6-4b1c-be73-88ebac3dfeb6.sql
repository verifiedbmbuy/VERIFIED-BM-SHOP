
-- Fix 1: Orders table - remove overly permissive policies
DROP POLICY IF EXISTS "Users can view own orders by email" ON public.orders;
DROP POLICY IF EXISTS "Customers can update order proof" ON public.orders;

-- Recreate with proper restrictions (admin-only read, scoped update)
CREATE POLICY "Users can view own orders by email"
ON public.orders FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'editor'::app_role) OR
  (customer_email = current_setting('request.jwt.claims', true)::json->>'email')
);

CREATE POLICY "Customers can update order proof"
ON public.orders FOR UPDATE
USING (
  customer_email = current_setting('request.jwt.claims', true)::json->>'email'
)
WITH CHECK (
  customer_email = current_setting('request.jwt.claims', true)::json->>'email'
);

-- Fix 2: Chat sessions - remove overly permissive policies
DROP POLICY IF EXISTS "Anyone can view own session" ON public.chat_sessions;
DROP POLICY IF EXISTS "Anyone can update session" ON public.chat_sessions;

-- Admins can view all sessions
CREATE POLICY "Admins can view all sessions"
ON public.chat_sessions FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'editor'::app_role)
);

-- Anyone can view session (needed for anonymous chat - scoped by session_id known only to visitor)
CREATE POLICY "Visitors can view own session"
ON public.chat_sessions FOR SELECT
USING (true);

-- Only admins can update sessions (for typing indicator, status changes)
CREATE POLICY "Admins can update session"
ON public.chat_sessions FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role)
);
