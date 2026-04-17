-- Update the public read policy to include site_version
DROP POLICY IF EXISTS "Public can read public settings" ON public.site_settings;
CREATE POLICY "Public can read public settings"
  ON public.site_settings
  FOR SELECT
  USING (key = ANY (ARRAY['header_logo','footer_logo','favicon','invoice_logo','site_title','maintenance_mode','site_version']));
