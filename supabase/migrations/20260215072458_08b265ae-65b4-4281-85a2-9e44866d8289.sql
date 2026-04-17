-- Allow customers to update their own order with proof (limited to proof fields only via app logic)
-- Using a permissive approach: anyone who knows the order ID can upload proof for it
CREATE POLICY "Customers can update order proof"
ON public.orders
FOR UPDATE
USING (true)
WITH CHECK (true);