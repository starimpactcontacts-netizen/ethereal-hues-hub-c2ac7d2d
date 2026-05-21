DROP POLICY IF EXISTS "Anyone can view participations" ON public.event_participations;

CREATE POLICY "Anyone can view participations"
ON public.event_participations
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Anyone can view round participations" ON public.round_participations;

CREATE POLICY "Anyone can view round participations"
ON public.round_participations
FOR SELECT
TO public
USING (true);