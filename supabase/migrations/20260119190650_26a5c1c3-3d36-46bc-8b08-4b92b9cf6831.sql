-- Fix the crews UPDATE policy to check owner_id directly (not from crew_members which may be empty)
DROP POLICY IF EXISTS "Owner can update crew" ON public.crews;

CREATE POLICY "Owner can update crew"
ON public.crews
FOR UPDATE
USING (owner_id = auth.uid());