-- Drop the restrictive update policy
DROP POLICY IF EXISTS "Owner can update crew" ON public.crews;

-- Create new policy that allows owner OR admin/dev to update
CREATE POLICY "Owner or admin can update crew"
ON public.crews
FOR UPDATE
USING (
  owner_id = auth.uid()
  OR has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'dev')
);