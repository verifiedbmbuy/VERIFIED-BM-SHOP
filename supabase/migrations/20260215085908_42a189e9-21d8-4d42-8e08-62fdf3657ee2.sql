-- Allow public (anon) read access to branding-related site_settings
CREATE POLICY "Public can read branding settings"
ON public.site_settings
FOR SELECT
USING (key IN ('header_logo', 'footer_logo', 'favicon', 'invoice_logo', 'site_title'));

-- Ensure branding bucket objects are publicly readable
CREATE POLICY "Public read branding objects"
ON storage.objects
FOR SELECT
USING (bucket_id = 'branding');

-- Allow admins to manage branding objects
CREATE POLICY "Admins can upload branding"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'branding' AND (SELECT public.has_role(auth.uid(), 'admin')));

CREATE POLICY "Admins can update branding"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'branding' AND (SELECT public.has_role(auth.uid(), 'admin')));

CREATE POLICY "Admins can delete branding"
ON storage.objects
FOR DELETE
USING (bucket_id = 'branding' AND (SELECT public.has_role(auth.uid(), 'admin')));