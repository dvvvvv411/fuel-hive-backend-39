-- Add visible_from_date column to user_roles table
ALTER TABLE public.user_roles 
ADD COLUMN visible_from_date date NULL;

-- Comment for documentation
COMMENT ON COLUMN public.user_roles.visible_from_date 
IS 'Optional: Caller sieht nur Orders ab diesem Datum';