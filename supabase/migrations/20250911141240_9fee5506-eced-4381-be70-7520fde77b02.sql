-- Create blocked_emails table for persistent spam protection
CREATE TABLE public.blocked_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL DEFAULT 'rate_limit_exceeded',
  blocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Enable RLS on blocked_emails table
ALTER TABLE public.blocked_emails ENABLE ROW LEVEL SECURITY;

-- Create policies for blocked_emails
CREATE POLICY "Allow authenticated users to view blocked emails" 
ON public.blocked_emails 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Allow authenticated users to insert blocked emails" 
ON public.blocked_emails 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Allow authenticated users to update blocked emails" 
ON public.blocked_emails 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text);

-- Create index for fast email lookups
CREATE INDEX idx_blocked_emails_email ON public.blocked_emails(email);
CREATE INDEX idx_blocked_emails_blocked_at ON public.blocked_emails(blocked_at);