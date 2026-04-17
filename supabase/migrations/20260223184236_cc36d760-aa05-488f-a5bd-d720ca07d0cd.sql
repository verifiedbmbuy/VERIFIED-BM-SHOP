
-- Table for logging sent newsletters
CREATE TABLE public.newsletters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  content text NOT NULL,
  target_audience text NOT NULL DEFAULT 'subscribers',
  recipient_count integer NOT NULL DEFAULT 0,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  sent_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view newsletters" ON public.newsletters
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert newsletters" ON public.newsletters
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete newsletters" ON public.newsletters
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Table for site notices / announcement bar
CREATE TABLE public.site_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  type text NOT NULL DEFAULT 'bar',
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.site_notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active notices" ON public.site_notices
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all notices" ON public.site_notices
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert notices" ON public.site_notices
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update notices" ON public.site_notices
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete notices" ON public.site_notices
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
