
DROP POLICY IF EXISTS "Public can read public settings" ON public.site_settings;

CREATE POLICY "Public can read public settings"
ON public.site_settings
FOR SELECT
USING (
  key = ANY (ARRAY[
    'header_logo', 'footer_logo', 'favicon', 'invoice_logo', 'site_title',
    'maintenance_mode', 'site_version', 'schema_config', 'robots_txt',
    'international_seo', 'page_hero_image', 'page_hero_overlay',
    'custom_json_ld', 'homepage_product_count',
    'seo_search_console_tag', 'seo_bing_verification_tag'
  ])
);
