
-- First, update any bank accounts that reference these orders to remove the foreign key reference
UPDATE bank_accounts 
SET used_for_order_id = NULL, temp_order_number = NULL
WHERE used_for_order_id IN (
  SELECT id FROM orders WHERE customer_email = 'totalfioul@yopmail.com'
);

-- Now we can safely delete the orders
DELETE FROM orders 
WHERE customer_email = 'totalfioul@yopmail.com';
