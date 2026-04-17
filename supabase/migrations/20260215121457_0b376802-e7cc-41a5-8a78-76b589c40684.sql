
-- Add per-page hero image and overlay columns
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS hero_image text;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS hero_overlay integer DEFAULT 50;
