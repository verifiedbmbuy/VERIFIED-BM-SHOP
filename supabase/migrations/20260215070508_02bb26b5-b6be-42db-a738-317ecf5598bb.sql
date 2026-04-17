
-- Create pages table for CMS page management
CREATE TABLE public.pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- Public can read published pages
CREATE POLICY "Published pages are public" ON public.pages FOR SELECT USING (status = 'published');

-- Admins/editors full access
CREATE POLICY "Admins can read all pages" ON public.pages FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));
CREATE POLICY "Admins can insert pages" ON public.pages FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));
CREATE POLICY "Admins can update pages" ON public.pages FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));
CREATE POLICY "Admins can delete pages" ON public.pages FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default pages
INSERT INTO public.pages (title, slug, status) VALUES
  ('Home', 'home', 'published'),
  ('Shop', 'shop', 'published'),
  ('Blog', 'blog', 'published'),
  ('Contact Us', 'contact', 'published'),
  ('About Us', 'about', 'published');

-- Updated_at trigger
CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profiles_updated_at();
