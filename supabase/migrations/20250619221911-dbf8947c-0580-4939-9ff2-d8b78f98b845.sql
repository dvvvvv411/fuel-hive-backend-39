
-- Add hidden column to orders table
ALTER TABLE public.orders 
ADD COLUMN hidden boolean NOT NULL DEFAULT false;
