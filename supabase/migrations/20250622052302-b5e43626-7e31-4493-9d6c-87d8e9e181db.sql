
-- First, remove the foreign key references from bank_accounts to orders
UPDATE public.bank_accounts 
SET used_for_order_id = NULL, temp_order_number = NULL 
WHERE used_for_order_id IS NOT NULL;

-- Now delete all orders from the orders table
DELETE FROM public.orders;
