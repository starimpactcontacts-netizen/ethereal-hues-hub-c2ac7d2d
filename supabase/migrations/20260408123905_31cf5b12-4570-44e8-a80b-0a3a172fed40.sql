
DROP POLICY IF EXISTS "Anyone can view pending cash battle applications" ON public.cash_battle_applications;

CREATE POLICY "Anyone can view pending cash battle applications"
ON public.cash_battle_applications
FOR SELECT
TO anon
USING (status = 'pending');
