
-- Drop the restrictive UPDATE policy that's causing the issue
DROP POLICY IF EXISTS "Owner can update member roles" ON public.crew_members;

-- Create a new policy that allows owners (via crews.owner_id) to update any member
CREATE POLICY "Owner can update member roles"
ON public.crew_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.crews
    WHERE crews.id = crew_members.crew_id
    AND crews.owner_id = auth.uid()
  )
);
