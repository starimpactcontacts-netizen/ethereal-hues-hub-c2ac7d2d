-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a new policy that allows everyone (including unauthenticated) to read profiles
CREATE POLICY "Anyone can view profiles"
ON public.profiles
FOR SELECT
TO public
USING (true);