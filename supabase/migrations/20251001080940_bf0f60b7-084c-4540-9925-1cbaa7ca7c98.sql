-- Add company name fields for billing and delivery addresses
ALTER TABLE public.orders
ADD COLUMN billing_company_name TEXT,
ADD COLUMN delivery_company_name TEXT;

-- Add index for searching by company names
CREATE INDEX idx_orders_billing_company_name ON public.orders(billing_company_name);
CREATE INDEX idx_orders_delivery_company_name ON public.orders(delivery_company_name);