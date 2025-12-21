-- Drop existing SELECT policy on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- New policy: Users can see their own profile OR admins can see all
CREATE POLICY "Users can view own profile or admins all"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id 
    OR public.has_role(auth.uid(), 'admin')
  );

-- Insert missing profile for admin@admin.de
INSERT INTO public.profiles (id, email)
VALUES ('805c9eb1-8e94-4681-9653-a9a64eb6fb3a', 'admin@admin.de')
ON CONFLICT (id) DO NOTHING;