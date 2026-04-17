-- Add review_id column for de-duplication link between reviews and testimonials
ALTER TABLE public.testimonials ADD COLUMN review_id uuid UNIQUE;
CREATE INDEX idx_testimonials_review_id ON public.testimonials (review_id);