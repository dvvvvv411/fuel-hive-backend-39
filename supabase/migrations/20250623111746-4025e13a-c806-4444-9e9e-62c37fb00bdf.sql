
-- Update the handle_new_order function to automatically set selected_bank_account_id for instant orders
CREATE OR REPLACE FUNCTION public.handle_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  shop_data RECORD;
  new_order_number TEXT;
  number_exists BOOLEAN;
BEGIN
  -- Get shop information including checkout mode and bank account
  SELECT * INTO shop_data 
  FROM shops 
  WHERE id = NEW.shop_id;

  -- Generate a unique 7-digit order number if not provided
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    LOOP
      -- Generate a random 7-digit number (1000000 to 9999999)
      new_order_number := (1000000 + floor(random() * 9000000)::int)::text;
      
      -- Check if this number already exists
      SELECT EXISTS(SELECT 1 FROM orders WHERE order_number = new_order_number) INTO number_exists;
      
      -- If it doesn't exist, we can use it
      IF NOT number_exists THEN
        EXIT;
      END IF;
    END LOOP;
    
    NEW.order_number := new_order_number;
  END IF;

  -- Set processing mode based on shop configuration
  NEW.processing_mode := COALESCE(shop_data.checkout_mode, 'manual');

  -- For instant mode, set status to confirmed and assign shop's default bank account
  IF NEW.processing_mode = 'instant' THEN
    NEW.status := 'confirmed';
    
    -- Automatically set the selected bank account to the shop's default bank account
    -- This ensures PDF generation can access the correct bank details
    IF shop_data.bank_account_id IS NOT NULL AND NEW.selected_bank_account_id IS NULL THEN
      NEW.selected_bank_account_id := shop_data.bank_account_id;
    END IF;
  ELSE
    NEW.status := 'pending';
  END IF;

  RETURN NEW;
END;
$function$;
