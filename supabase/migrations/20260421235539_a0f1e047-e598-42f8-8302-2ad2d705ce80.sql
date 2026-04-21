DROP POLICY IF EXISTS "Participants can update their battle" ON public.battles;

CREATE POLICY "Participants or open-challenge claimers can update battle"
ON public.battles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = challenger_id
  OR auth.uid() = opponent_id
  OR (status = 'pending' AND opponent_id IS NULL AND auth.uid() <> challenger_id)
  OR has_role(auth.uid(), 'judge'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'dev'::app_role)
)
WITH CHECK (
  auth.uid() = challenger_id
  OR auth.uid() = opponent_id
  OR (status = 'active' AND auth.uid() <> challenger_id)
  OR has_role(auth.uid(), 'judge'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'dev'::app_role)
);