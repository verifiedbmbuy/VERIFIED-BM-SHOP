
-- Create product_reviews table for verified buyer reviews
CREATE TABLE public.product_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'approved',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique constraint: one review per user per product
CREATE UNIQUE INDEX idx_product_reviews_unique ON public.product_reviews (product_id, user_id);

-- Enable RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved reviews
CREATE POLICY "Approved reviews are public"
ON public.product_reviews FOR SELECT
USING (status = 'approved');

-- Admins can view all reviews
CREATE POLICY "Admins can view all reviews"
ON public.product_reviews FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can insert their own reviews
CREATE POLICY "Users can insert own reviews"
ON public.product_reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
ON public.product_reviews FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can delete reviews
CREATE POLICY "Admins can delete reviews"
ON public.product_reviews FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to notify customer when order status changes to completed
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  customer_user_id UUID;
  product_names TEXT;
  product_slug TEXT;
  first_product_id UUID;
BEGIN
  -- Only fire when status changes to completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Find the user_id from profiles by email
    SELECT id INTO customer_user_id FROM public.profiles WHERE email = NEW.customer_email LIMIT 1;
    
    IF customer_user_id IS NOT NULL THEN
      -- Get product info from order items
      SELECT string_agg(oi.product_title, ', '), 
             (SELECT p.slug FROM public.products p JOIN public.order_items oi2 ON p.id = oi2.product_id WHERE oi2.order_id = NEW.id LIMIT 1),
             (SELECT oi3.product_id FROM public.order_items oi3 WHERE oi3.order_id = NEW.id LIMIT 1)
      INTO product_names, product_slug, first_product_id
      FROM public.order_items oi WHERE oi.order_id = NEW.id;
      
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (
        customer_user_id,
        'Order Approved! 🎉',
        'Your order for ' || COALESCE(product_names, 'your product') || ' has been approved! It will be delivered soon. Please remember to leave a review on the product page once you receive it!',
        'order',
        '/product/' || COALESCE(product_slug, '')
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_order_status_change
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_order_status_change();
