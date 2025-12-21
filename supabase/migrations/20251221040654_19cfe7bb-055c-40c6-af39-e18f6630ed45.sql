-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'caller');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create caller_shops table for shop assignments
CREATE TABLE public.caller_shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, shop_id)
);

ALTER TABLE public.caller_shops ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get caller's allowed shop IDs
CREATE OR REPLACE FUNCTION public.get_caller_shop_ids(_user_id uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    ARRAY(SELECT shop_id FROM public.caller_shops WHERE user_id = _user_id),
    ARRAY[]::uuid[]
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Admins can view user roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert user roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update user roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete user roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can view their own role
CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for caller_shops
CREATE POLICY "Admins can manage caller shops"
  ON public.caller_shops FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Callers can view their own shop assignments
CREATE POLICY "Callers can view own shops"
  ON public.caller_shops FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Migrate existing users
INSERT INTO public.user_roles (user_id, role)
VALUES 
  ('3338709d-0620-4384-8705-f6b4e9bf8be6', 'caller'),
  ('70156cbe-8d83-4b7c-b421-3bbe6ca71298', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;