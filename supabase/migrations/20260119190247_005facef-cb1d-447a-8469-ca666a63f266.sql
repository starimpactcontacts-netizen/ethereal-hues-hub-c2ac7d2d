-- Drop the existing insert policy and create a more permissive one that allows crew owners to add members
DROP POLICY IF EXISTS "Staff can add members" ON public.crew_members;

-- Create new policy that allows:
-- 1. Crew staff (owner/officer) to add members
-- 2. Users to add themselves (for joining open crews)
-- 3. The crew owner (from crews table) to add the first member (themselves)
CREATE POLICY "Staff or self can add members" 
ON public.crew_members 
FOR INSERT 
WITH CHECK (
  is_crew_staff(crew_id, auth.uid()) 
  OR (auth.uid() = user_id)
  OR EXISTS (
    SELECT 1 FROM public.crews 
    WHERE id = crew_id AND owner_id = auth.uid()
  )
);