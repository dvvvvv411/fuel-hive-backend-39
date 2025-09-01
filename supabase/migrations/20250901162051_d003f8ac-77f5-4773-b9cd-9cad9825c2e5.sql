-- Delete all orders created before August 23, 2025
DELETE FROM public.orders 
WHERE created_at < '2025-08-23'::date;