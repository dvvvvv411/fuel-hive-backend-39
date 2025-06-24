
-- Fix missing selected_bank_account_id for orders with generated invoices
-- This updates orders that have invoices but are missing the selected_bank_account_id

UPDATE orders 
SET selected_bank_account_id = shops.bank_account_id
FROM shops 
WHERE orders.shop_id = shops.id 
  AND orders.invoice_pdf_generated = true 
  AND orders.selected_bank_account_id IS NULL 
  AND shops.bank_account_id IS NOT NULL;

-- Also update orders that might have temporary bank accounts assigned
UPDATE orders 
SET selected_bank_account_id = bank_accounts.id
FROM bank_accounts 
WHERE bank_accounts.used_for_order_id = orders.id 
  AND orders.invoice_pdf_generated = true 
  AND orders.selected_bank_account_id IS NULL 
  AND bank_accounts.is_temporary = true;
