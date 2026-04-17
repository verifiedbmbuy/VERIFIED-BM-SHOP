-- Drop old branding-only policy and replace with one that also includes maintenance_mode
DROP POLICY IF EXISTS "Public can read branding settings" ON public.site_settings;

CREATE POLICY "Public can read public settings"
ON public.site_settings
FOR SELECT
USING (key IN ('header_logo', 'footer_logo', 'favicon', 'invoice_logo', 'site_title', 'maintenance_mode'));