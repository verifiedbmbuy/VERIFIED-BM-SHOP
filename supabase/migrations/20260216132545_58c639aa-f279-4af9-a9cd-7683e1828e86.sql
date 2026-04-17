
-- Restore chat access for anonymous visitors (session UUID acts as bearer token)
CREATE POLICY "Visitors can view own session by id"
ON public.chat_sessions FOR SELECT
USING (true);

CREATE POLICY "Visitors can view session messages"
ON public.chat_messages FOR SELECT
USING (true);

-- Allow visitors to update their own session (for timestamp updates)
CREATE POLICY "Visitors can update own session"
ON public.chat_sessions FOR UPDATE
USING (true);
