
-- =============================================
-- 1. COMMENTS TABLE for blog post comments
-- =============================================
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved comments
CREATE POLICY "Approved comments are public"
ON public.comments FOR SELECT
USING (status = 'approved');

-- Anyone can submit a comment
CREATE POLICY "Anyone can submit comments"
ON public.comments FOR INSERT
WITH CHECK (true);

-- Admins/editors can see all comments (including pending)
CREATE POLICY "Admins can see all comments"
ON public.comments FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

-- Admins/editors can update comment status
CREATE POLICY "Admins can update comments"
ON public.comments FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

-- Admins/editors can delete comments
CREATE POLICY "Admins can delete comments"
ON public.comments FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

-- =============================================
-- 2. PRODUCT CRUD POLICIES for admin management
-- =============================================
CREATE POLICY "Admins can insert products"
ON public.products FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update products"
ON public.products FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete products"
ON public.products FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- 3. CONTACT MESSAGES - allow admins to read
-- =============================================
CREATE POLICY "Admins can read contact messages"
ON public.contact_messages FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));
