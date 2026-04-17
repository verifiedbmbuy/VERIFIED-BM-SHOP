-- Drop old check constraints
ALTER TABLE public.orders DROP CONSTRAINT orders_status_check;
ALTER TABLE public.orders DROP CONSTRAINT orders_payment_method_check;

-- Add updated status check matching the app's status pipeline
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status = ANY (ARRAY['created', 'pending', 'pending_verification', 'processing', 'completed', 'paid', 'failed', 'timed_out', 'cancelled']));

-- Remove payment_method check entirely — slugs are dynamic from payment_methods table
-- No constraint needed since payment methods are admin-managed