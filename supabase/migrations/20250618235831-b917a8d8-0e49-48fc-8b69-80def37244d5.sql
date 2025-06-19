
-- Add daily_limit column to bank_accounts table
ALTER TABLE public.bank_accounts 
ADD COLUMN daily_limit NUMERIC DEFAULT 0;

-- Add comment to explain the column
COMMENT ON COLUMN public.bank_accounts.daily_limit IS 'Daily transaction limit for the bank account in the account currency';
