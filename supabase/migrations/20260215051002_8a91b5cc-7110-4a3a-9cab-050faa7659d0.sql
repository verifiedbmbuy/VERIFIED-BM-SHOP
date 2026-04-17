
-- Create storage bucket for media
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

-- Allow public read access
CREATE POLICY "Media files are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'media');

-- Allow anyone to upload (will be restricted to admin auth later)
CREATE POLICY "Allow media uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media');

-- Allow anyone to update media
CREATE POLICY "Allow media updates" ON storage.objects FOR UPDATE USING (bucket_id = 'media');

-- Allow anyone to delete media
CREATE POLICY "Allow media deletes" ON storage.objects FOR DELETE USING (bucket_id = 'media');

-- Create media_files table for metadata
CREATE TABLE public.media_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
  width INTEGER,
  height INTEGER,
  alt_text TEXT DEFAULT '',
  caption TEXT DEFAULT '',
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Media files are viewable by everyone" ON public.media_files FOR SELECT USING (true);
CREATE POLICY "Allow insert media files" ON public.media_files FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update media files" ON public.media_files FOR UPDATE USING (true);
CREATE POLICY "Allow delete media files" ON public.media_files FOR DELETE USING (true);
