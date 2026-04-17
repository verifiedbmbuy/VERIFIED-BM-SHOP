
CREATE TABLE public.menus (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label text NOT NULL,
  url text NOT NULL,
  position text NOT NULL DEFAULT 'header',
  sort_order integer NOT NULL DEFAULT 0,
  icon text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Menus are viewable by everyone" ON public.menus FOR SELECT USING (true);
CREATE POLICY "Admins can insert menus" ON public.menus FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update menus" ON public.menus FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete menus" ON public.menus FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
