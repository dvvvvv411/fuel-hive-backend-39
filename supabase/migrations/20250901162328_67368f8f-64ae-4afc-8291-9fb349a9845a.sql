-- First, remove references from shops to these bank accounts
UPDATE public.shops 
SET bank_account_id = NULL 
WHERE bank_account_id IN (
  SELECT id FROM public.bank_accounts 
  WHERE account_name IN (
    'Targobank Poseidon',
    'Kein Konto',
    'UNICREDIT',
    'Sparkasse Poseidon',
    'Noris'
  )
);

-- Then delete the specific bank accounts
DELETE FROM public.bank_accounts 
WHERE account_name IN (
  'Targobank Poseidon',
  'Kein Konto',
  'UNICREDIT',
  'Sparkasse Poseidon',
  'Noris'
);