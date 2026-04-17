
-- Add new columns to products table for SKU, inventory, SEO, and gallery
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku text UNIQUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity integer NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_status text NOT NULL DEFAULT 'in_stock';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS meta_title text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS meta_description text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gallery_images text[] DEFAULT '{}';
