
-- Add the use_anyname column to the bank_accounts table
ALTER TABLE public.bank_accounts 
ADD COLUMN use_anyname boolean NOT NULL DEFAULT false;
