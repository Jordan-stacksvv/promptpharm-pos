-- Step 1: Create user_roles table using existing user_role enum
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 2: Create SECURITY DEFINER function to prevent RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Step 3: Migrate existing role data from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role 
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 4: Update get_current_user_role to use user_roles table
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1;
$$;

-- Step 5: Enable RLS on exposed tables
ALTER TABLE public.scanned_barcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.condition_medicines ENABLE ROW LEVEL SECURITY;

-- Step 6: Add RLS policies for scanned_barcodes
CREATE POLICY "Users can manage their scanned barcodes"
ON public.scanned_barcodes
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM scanner_sessions 
    WHERE scanner_sessions.session_id = scanned_barcodes.session_id 
    AND scanner_sessions.cashier_id = auth.uid()
  )
);

-- Step 7: Add RLS policies for conditions (medical staff only)
CREATE POLICY "Staff can view conditions"
ON public.conditions
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::user_role) OR
  public.has_role(auth.uid(), 'manager'::user_role) OR
  public.has_role(auth.uid(), 'pharmacist'::user_role)
);

CREATE POLICY "Admins and managers can manage conditions"
ON public.conditions
FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::user_role) OR
  public.has_role(auth.uid(), 'manager'::user_role)
);

-- Step 8: Add RLS policies for condition_medicines (medical staff only)
CREATE POLICY "Staff can view condition medicines"
ON public.condition_medicines
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::user_role) OR
  public.has_role(auth.uid(), 'manager'::user_role) OR
  public.has_role(auth.uid(), 'pharmacist'::user_role)
);

CREATE POLICY "Admins and managers can manage condition medicines"
ON public.condition_medicines
FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::user_role) OR
  public.has_role(auth.uid(), 'manager'::user_role)
);

-- Step 9: Add RLS policies for user_roles table
CREATE POLICY "Admins can manage all user roles"
ON public.user_roles
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT TO authenticated
USING (auth.uid() = user_id);