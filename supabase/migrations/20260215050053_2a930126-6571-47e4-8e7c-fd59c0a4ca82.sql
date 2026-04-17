
ALTER TABLE public.blog_posts 
ADD COLUMN author text NOT NULL DEFAULT 'Admin',
ADD COLUMN status text NOT NULL DEFAULT 'draft';

-- Update existing posts to published
UPDATE public.blog_posts SET status = 'published' WHERE published_at IS NOT NULL;

-- Allow admin insert/update/delete (public for now, auth can be added later)
CREATE POLICY "Allow insert blog posts" ON public.blog_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update blog posts" ON public.blog_posts FOR UPDATE USING (true);
CREATE POLICY "Allow delete blog posts" ON public.blog_posts FOR DELETE USING (true);
