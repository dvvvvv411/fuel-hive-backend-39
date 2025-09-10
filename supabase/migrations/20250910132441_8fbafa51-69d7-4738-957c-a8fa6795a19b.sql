-- Create login_events table to track user login activity
CREATE TABLE public.login_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('sign_in', 'sign_up', 'sign_out')),
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;

-- Create policies for login events (only admins can view all login events)
CREATE POLICY "Allow all authenticated users to view login events" 
ON public.login_events 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Create index for better performance
CREATE INDEX idx_login_events_user_id ON public.login_events(user_id);
CREATE INDEX idx_login_events_created_at ON public.login_events(created_at DESC);
CREATE INDEX idx_login_events_email ON public.login_events(email);