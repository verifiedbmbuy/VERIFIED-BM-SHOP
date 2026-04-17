
-- Auto-create notification when a new order is placed
CREATE OR REPLACE FUNCTION public.notify_new_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  FOR admin_record IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      admin_record.user_id,
      'New Order Received',
      'Order from ' || NEW.customer_name || ' — $' || NEW.total_amount,
      'order',
      '/admin/orders'
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_order_notify
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_order();
