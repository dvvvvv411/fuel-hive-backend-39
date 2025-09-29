-- Add currency support columns to orders table
ALTER TABLE public.orders 
ADD COLUMN currency TEXT DEFAULT 'EUR' NOT NULL,
ADD COLUMN eur_amount NUMERIC DEFAULT NULL,
ADD COLUMN exchange_rate NUMERIC DEFAULT 1.00;

-- Update existing orders to have EUR currency and eur_amount equal to total_amount
UPDATE public.orders 
SET currency = 'EUR', eur_amount = total_amount, exchange_rate = 1.00 
WHERE currency IS NULL OR eur_amount IS NULL;

-- Create index for better performance on currency queries
CREATE INDEX idx_orders_currency ON public.orders(currency);
CREATE INDEX idx_orders_eur_amount ON public.orders(eur_amount);