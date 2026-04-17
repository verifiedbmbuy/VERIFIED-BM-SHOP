-- Add description column to media_files for long-form metadata
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS description text DEFAULT '';
