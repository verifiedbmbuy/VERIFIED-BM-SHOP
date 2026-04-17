
-- Work Samples (Portfolio)
CREATE TABLE public.work_samples (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  client_name TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  image_url TEXT,
  link TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.work_samples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Work samples are viewable by everyone" ON public.work_samples FOR SELECT USING (true);
CREATE POLICY "Admins can insert work samples" ON public.work_samples FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update work samples" ON public.work_samples FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete work samples" ON public.work_samples FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Testimonials
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  job_title TEXT,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  testimonial_text TEXT NOT NULL,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'approved',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved testimonials are public" ON public.testimonials FOR SELECT USING (status = 'approved');
CREATE POLICY "Admins can read all testimonials" ON public.testimonials FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));
CREATE POLICY "Admins can insert testimonials" ON public.testimonials FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update testimonials" ON public.testimonials FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete testimonials" ON public.testimonials FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- FAQs
CREATE TABLE public.faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  faq_group TEXT NOT NULL DEFAULT 'General',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "FAQs are viewable by everyone" ON public.faqs FOR SELECT USING (true);
CREATE POLICY "Admins can insert faqs" ON public.faqs FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update faqs" ON public.faqs FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete faqs" ON public.faqs FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Add components column to pages
ALTER TABLE public.pages ADD COLUMN components JSONB DEFAULT '{}';
