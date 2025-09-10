-- Enable RLS on all tables that don't have it enabled
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tokens ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resend_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for these tables (allow all authenticated users for now)
-- You may want to customize these policies based on your specific security requirements

-- Bank accounts policies
CREATE POLICY "Allow authenticated users to view bank accounts" 
ON public.bank_accounts FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert bank accounts" 
ON public.bank_accounts FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update bank accounts" 
ON public.bank_accounts FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Order tokens policies
CREATE POLICY "Allow authenticated users to view order tokens" 
ON public.order_tokens FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert order tokens" 
ON public.order_tokens FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Orders policies  
CREATE POLICY "Allow authenticated users to view orders" 
ON public.orders FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert orders" 
ON public.orders FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update orders" 
ON public.orders FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Payment methods policies
CREATE POLICY "Allow authenticated users to view payment methods" 
ON public.payment_methods FOR SELECT 
USING (auth.role() = 'authenticated');

-- Resend configs policies
CREATE POLICY "Allow authenticated users to view resend configs" 
ON public.resend_configs FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert resend configs" 
ON public.resend_configs FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update resend configs" 
ON public.resend_configs FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Shop payment methods policies
CREATE POLICY "Allow authenticated users to view shop payment methods" 
ON public.shop_payment_methods FOR SELECT 
USING (auth.role() = 'authenticated');

-- Shops policies
CREATE POLICY "Allow authenticated users to view shops" 
ON public.shops FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert shops" 
ON public.shops FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update shops" 
ON public.shops FOR UPDATE 
USING (auth.role() = 'authenticated');