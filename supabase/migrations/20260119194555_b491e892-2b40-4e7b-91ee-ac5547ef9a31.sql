-- Drop the current update policy
DROP POLICY IF EXISTS "Owner can update member roles" ON public.crew_members;

-- Create a new policy that allows:
-- 1. The crew owner (via crews.owner_id) to update any member
-- 2. Admins/devs to update any member (bypass for admin accounts)
CREATE POLICY "Owner or admin can update member roles"
ON public.crew_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.crews
    WHERE crews.id = crew_members.crew_id
    AND crews.owner_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'dev')
);
