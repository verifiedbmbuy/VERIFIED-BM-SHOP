-- Ensure key products remain purchasable in local/dev environments.
-- This prevents checkout edge-function validation from failing on zero stock.
UPDATE public.products
SET
  stock_quantity = GREATEST(COALESCE(stock_quantity, 0), 25),
  stock_status = 'in_stock'
WHERE slug IN (
  'buy-verified-bm-3',
  'buy-whatsapp-api-10000',
  'buy-whatsapp-business-api-limit-2000'
);
