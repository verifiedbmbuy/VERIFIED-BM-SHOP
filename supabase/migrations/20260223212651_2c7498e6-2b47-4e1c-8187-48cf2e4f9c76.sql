-- Allow admins to update product reviews (currently only review authors can)
CREATE POLICY "Admins can update reviews"
ON public.product_reviews
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));