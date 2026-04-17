
-- ============================================
-- FIX 1: Restrict media storage bucket policies to admin/editor only
-- ============================================
DROP POLICY IF EXISTS "Allow media uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow media updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow media deletes" ON storage.objects;

CREATE POLICY "Editors can upload media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
);

CREATE POLICY "Editors can update media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'media' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
);

CREATE POLICY "Editors can delete media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
);

-- ============================================
-- FIX 2: Remove public SELECT on chat_sessions (keep admin/editor only)
-- ============================================
DROP POLICY IF EXISTS "Visitors can view own session by id" ON public.chat_sessions;
DROP POLICY IF EXISTS "Visitors can update own session" ON public.chat_sessions;

-- ============================================
-- FIX 3: Clean up duplicate branding storage policies
-- ============================================
DROP POLICY IF EXISTS "Branding files are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload branding files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update branding files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete branding files" ON storage.objects;

-- Keep only the second set (or recreate clean ones)
DROP POLICY IF EXISTS "Public read branding objects" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload branding" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update branding" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete branding" ON storage.objects;

CREATE POLICY "Branding publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'branding');

CREATE POLICY "Admins manage branding uploads"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'branding' AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins manage branding updates"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'branding' AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins manage branding deletes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'branding' AND public.has_role(auth.uid(), 'admin')
);

-- ============================================
-- FIX 4: Fix overly permissive RLS policies (USING true for non-SELECT)
-- Chat messages: "Anyone can insert messages" WITH CHECK (true) - keep for visitor chat
-- Chat sessions: "Anyone can create chat sessions" WITH CHECK (true) - keep for visitor chat  
-- Comments: "Anyone can submit comments" WITH CHECK (true) - keep for public comments
-- Orders: "Anyone can create orders" WITH CHECK (true) - keep for guest checkout
-- Order items: "Anyone can insert order items" WITH CHECK (true) - keep for guest checkout
-- These are intentional for guest/visitor functionality
-- ============================================
