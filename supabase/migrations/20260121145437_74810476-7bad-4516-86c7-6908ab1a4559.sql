-- Drop the admin-only policy for crew creation
DROP POLICY IF EXISTS "Only admins can create crews" ON public.crews;

-- Create new policy allowing any authenticated user to create crews
CREATE POLICY "Authenticated users can create crews"
ON public.crews
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);