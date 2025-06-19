
-- Add columns to bank_accounts table for temporary bank accounts
ALTER TABLE public.bank_accounts 
ADD COLUMN is_temporary BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN used_for_order_id UUID REFERENCES public.orders(id),
ADD COLUMN temp_order_number TEXT;

-- Add index for better performance when querying temporary bank accounts
CREATE INDEX idx_bank_accounts_temporary ON public.bank_accounts(is_temporary, used_for_order_id);

-- Add column to orders table to store temporary order number for manual orders
ALTER TABLE public.orders 
ADD COLUMN temp_order_number TEXT;
