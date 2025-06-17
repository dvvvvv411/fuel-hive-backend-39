
-- Create a function to handle new order processing
CREATE OR REPLACE FUNCTION public.handle_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  shop_data RECORD;
BEGIN
  -- Get shop information including checkout mode
  SELECT * INTO shop_data 
  FROM shops 
  WHERE id = NEW.shop_id;

  -- Generate order number if not provided
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'ORD-' || EXTRACT(YEAR FROM NOW()) || '-' || 
                        LPAD(EXTRACT(DOY FROM NOW())::text, 3, '0') || '-' ||
                        LPAD(EXTRACT(HOUR FROM NOW())::text, 2, '0') ||
                        LPAD(EXTRACT(MINUTE FROM NOW())::text, 2, '0') ||
                        LPAD(EXTRACT(SECOND FROM NOW())::text, 2, '0');
  END IF;

  -- Set processing mode based on shop configuration
  NEW.processing_mode := COALESCE(shop_data.checkout_mode, 'manual');

  -- For instant mode, set status to confirmed
  IF NEW.processing_mode = 'instant' THEN
    NEW.status := 'confirmed';
  ELSE
    NEW.status := 'pending';
  END IF;

  RETURN NEW;
END;
$function$;

-- Create trigger for order processing
DROP TRIGGER IF EXISTS trigger_handle_new_order ON public.orders;
CREATE TRIGGER trigger_handle_new_order
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_order();

-- Create a function to handle post-insert order processing
CREATE OR REPLACE FUNCTION public.handle_order_post_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Call the appropriate edge function based on processing mode
  IF NEW.processing_mode = 'instant' THEN
    -- For instant mode: generate invoice and send email
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/process-instant-order',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object('order_id', NEW.id::text)
    );
  ELSE
    -- For manual mode: send confirmation email only
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/process-manual-order',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object('order_id', NEW.id::text)
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Create trigger for post-insert processing
DROP TRIGGER IF EXISTS trigger_handle_order_post_insert ON public.orders;
CREATE TRIGGER trigger_handle_order_post_insert
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_post_insert();

-- Set up configuration for the HTTP extension (if not already set)
-- These would typically be set via Supabase dashboard or environment
-- ALTER SYSTEM SET app.supabase_url = 'https://luhhnsvwtnmxztcmdxyq.supabase.co';
-- ALTER SYSTEM SET app.service_role_key = 'your_service_role_key_here';
