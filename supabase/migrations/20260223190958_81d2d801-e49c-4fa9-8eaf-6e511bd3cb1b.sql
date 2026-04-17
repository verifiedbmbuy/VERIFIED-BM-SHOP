-- Allow customers to view their own order items (joined through orders by email)
CREATE POLICY "Users can view own order items"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
    AND o.customer_email = (current_setting('request.jwt.claims', true)::json->>'email')
  )
);