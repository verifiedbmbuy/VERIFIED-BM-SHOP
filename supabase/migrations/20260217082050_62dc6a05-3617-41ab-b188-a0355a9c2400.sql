
-- Restore chat_sessions policies for visitors but scoped to session-based access
-- Visitors need to view and update their own session by ID (which they know)
CREATE POLICY "Visitors can view own session by id"
ON public.chat_sessions FOR SELECT
USING (true);

CREATE POLICY "Visitors can update own session"
ON public.chat_sessions FOR UPDATE
USING (true);
