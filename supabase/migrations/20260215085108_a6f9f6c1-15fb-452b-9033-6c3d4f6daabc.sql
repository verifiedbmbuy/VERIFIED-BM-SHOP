
-- Create branding storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Branding files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'branding');

-- Allow admins to upload branding files
CREATE POLICY "Admins can upload branding files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'branding' AND has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update branding files
CREATE POLICY "Admins can update branding files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'branding' AND has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete branding files
CREATE POLICY "Admins can delete branding files"
ON storage.objects FOR DELETE
USING (bucket_id = 'branding' AND has_role(auth.uid(), 'admin'::app_role));
