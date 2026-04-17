
-- Create payment_methods table for modular payment architecture
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'manual' CHECK (type IN ('manual', 'api', 'placeholder')),
  is_active BOOLEAN NOT NULL DEFAULT false,
  icon TEXT DEFAULT NULL,
  description TEXT DEFAULT NULL,
  instructions TEXT DEFAULT NULL,
  custom_note TEXT DEFAULT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Everyone can read active payment methods (needed for checkout)
CREATE POLICY "Active payment methods are public"
ON public.payment_methods FOR SELECT
USING (is_active = true);

-- Admins can read all (including inactive)
CREATE POLICY "Admins can read all payment methods"
ON public.payment_methods FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert payment methods"
ON public.payment_methods FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update payment methods"
ON public.payment_methods FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete payment methods"
ON public.payment_methods FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default payment methods
INSERT INTO public.payment_methods (name, slug, type, is_active, icon, description, sort_order) VALUES
('Cryptomus', 'cryptomus', 'api', true, '🔒', 'Automatic crypto payment. Supports BTC, ETH, USDT & more.', 1),
('Binance Pay', 'binance', 'manual', true, '💳', 'Manual transfer. Send payment & upload screenshot proof.', 2),
('Other Payment Methods', 'other', 'placeholder', false, '🔜', 'This payment method is coming soon. Please contact support or choose another option.', 3);

-- Standardize order statuses: migrate existing data
-- created -> created (new initial)
-- pending -> processing  
-- pending_verification -> processing
-- paid -> completed
-- timed_out -> failed
-- cancelled -> cancelled
UPDATE public.orders SET status = 'processing' WHERE status IN ('pending', 'pending_verification');
UPDATE public.orders SET status = 'completed' WHERE status = 'paid';
UPDATE public.orders SET status = 'failed' WHERE status = 'timed_out';

-- Update trigger for payment_methods updated_at
CREATE TRIGGER update_payment_methods_updated_at
BEFORE UPDATE ON public.payment_methods
FOR EACH ROW
EXECUTE FUNCTION public.update_profiles_updated_at();
