-- First, remove references to orders that will be deleted from bank_accounts
UPDATE public.bank_accounts 
SET used_for_order_id = NULL 
WHERE used_for_order_id IN (
  SELECT id FROM public.orders 
  WHERE created_at < '2025-08-23'::date
);

-- Then delete temporary bank accounts that were created for orders before 2025-08-23
DELETE FROM public.bank_accounts 
WHERE is_temporary = true 
AND used_for_order_id IN (
  SELECT id FROM public.orders 
  WHERE created_at < '2025-08-23'::date
);

-- Finally, delete all orders created before August 23, 2025
DELETE FROM public.orders 
WHERE created_at < '2025-08-23'::date;