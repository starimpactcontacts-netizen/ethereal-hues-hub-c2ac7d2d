-- Update RLS policy to only allow crew OWNERS to propose tournaments (not officers)
DROP POLICY IF EXISTS "Crew staff can propose tournaments" ON public.sanctioned_tournaments;

CREATE POLICY "Crew owners can propose tournaments"
ON public.sanctioned_tournaments FOR INSERT
WITH CHECK (is_crew_owner(crew_id, auth.uid()));