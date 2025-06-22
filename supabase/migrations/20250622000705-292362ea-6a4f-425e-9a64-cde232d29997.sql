
-- Add selected_bank_account_id column to orders table
ALTER TABLE public.orders 
ADD COLUMN selected_bank_account_id uuid REFERENCES public.bank_accounts(id);

-- Add comment to explain the column purpose
COMMENT ON COLUMN public.orders.selected_bank_account_id IS 'Bank account selected during invoice generation for manual orders';
