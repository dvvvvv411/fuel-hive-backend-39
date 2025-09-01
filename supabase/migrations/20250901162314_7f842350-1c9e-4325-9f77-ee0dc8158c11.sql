-- Delete specific bank accounts
DELETE FROM public.bank_accounts 
WHERE account_name IN (
  'Targobank Poseidon',
  'Kein Konto',
  'UNICREDIT',
  'Sparkasse Poseidon',
  'Noris'
);