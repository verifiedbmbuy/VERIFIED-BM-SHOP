
-- 1. PROFILES: Restrict SELECT to owner + admins (was public true)
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (id = auth.uid());
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

-- 2. NEWSLETTER_SUBSCRIBERS: Restrict SELECT to admins only (was public true)
DROP POLICY IF EXISTS "Anyone can check own email" ON public.newsletter_subscribers;
CREATE POLICY "Admins can view subscribers"
ON public.newsletter_subscribers FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

-- 3. ORDER_ITEMS: Restrict SELECT to admins (was public true)
DROP POLICY IF EXISTS "Order items are viewable" ON public.order_items;
CREATE POLICY "Admins can view order items"
ON public.order_items FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

-- 4. NOTIFICATIONS: Restrict INSERT to admins/system only (was public true)
DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.notifications;
CREATE POLICY "System and admins can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5. COMMENTS: Create a public view without emails for approved comments
CREATE OR REPLACE VIEW public.comments_public
WITH (security_invoker = on) AS
SELECT id, post_id, author_name, content, parent_id, created_at, status
FROM public.comments
WHERE status = 'approved';

-- 6. CHAT_SESSIONS: Remove the overly permissive visitor SELECT, keep admin-only
DROP POLICY IF EXISTS "Visitors can view own session" ON public.chat_sessions;

-- 7. CHAT_MESSAGES: Restrict to admin-only SELECT
DROP POLICY IF EXISTS "Anyone can view messages" ON public.chat_messages;
CREATE POLICY "Admins can view all messages"
ON public.chat_messages FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));
