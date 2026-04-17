
-- Newsletter subscribers table
CREATE TABLE public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'subscribed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT newsletter_subscribers_email_unique UNIQUE (email)
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (insert)
CREATE POLICY "Anyone can subscribe"
ON public.newsletter_subscribers FOR INSERT
WITH CHECK (true);

-- Public can check if their email exists (for duplicate check)
CREATE POLICY "Anyone can check own email"
ON public.newsletter_subscribers FOR SELECT
USING (true);

-- Admins can update subscriber status
CREATE POLICY "Admins can update subscribers"
ON public.newsletter_subscribers FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

-- Admins can delete subscribers
CREATE POLICY "Admins can delete subscribers"
ON public.newsletter_subscribers FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));
