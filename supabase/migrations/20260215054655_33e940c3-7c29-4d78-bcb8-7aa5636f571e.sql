
-- Add SEO fields to blog_posts
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS meta_title text,
ADD COLUMN IF NOT EXISTS meta_description text,
ADD COLUMN IF NOT EXISTS focus_keyword text;
