-- Change default status for new product reviews from 'approved' to 'pending'
ALTER TABLE public.product_reviews ALTER COLUMN status SET DEFAULT 'pending';