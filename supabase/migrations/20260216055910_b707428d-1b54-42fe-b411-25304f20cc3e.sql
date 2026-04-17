
-- Add url_slug column for SEO-friendly public paths
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS url_slug text;

-- Create unique index for slug lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_media_files_url_slug ON public.media_files (url_slug) WHERE url_slug IS NOT NULL;
