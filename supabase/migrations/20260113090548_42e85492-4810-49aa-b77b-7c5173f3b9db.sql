-- 1. Add is_banned and is_hidden columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS banned_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS banned_reason text;

-- 2. Drop existing crew creation policies and replace with admin-only
DROP POLICY IF EXISTS "Authenticated users can create crews" ON public.crews;
DROP POLICY IF EXISTS "Owner can delete crew" ON public.crews;

-- 3. Only admins can create crews
CREATE POLICY "Only admins can create crews" 
ON public.crews 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

-- 4. Only admins can delete crews
CREATE POLICY "Only admins can delete crews" 
ON public.crews 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- 5. Update profile SELECT policy to exclude hidden/banned users (except for admins and self)
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

CREATE POLICY "Anyone can view non-hidden profiles" 
ON public.profiles 
FOR SELECT 
USING (
  -- Always allow admins to see all
  has_role(auth.uid(), 'admin')
  -- Allow users to see their own profile
  OR auth.uid() = id
  -- Allow viewing non-hidden, non-banned profiles
  OR (is_hidden = false AND is_banned = false)
);

-- 6. Delete demo crews
DELETE FROM public.crew_members WHERE crew_id IN (
  SELECT id FROM public.crews WHERE name IN ('LOOPGATE HUB', 'Somali Scammer Group')
);
DELETE FROM public.crews WHERE name IN ('LOOPGATE HUB', 'Somali Scammer Group');