
-- Remove the problematic triggers that use the net schema
DROP TRIGGER IF EXISTS trigger_handle_order_post_insert ON public.orders;
DROP FUNCTION IF EXISTS public.handle_order_post_insert();

-- Keep the pre-insert trigger as it doesn't use net schema
-- This trigger handles order number generation and status setting
-- and will remain functional
