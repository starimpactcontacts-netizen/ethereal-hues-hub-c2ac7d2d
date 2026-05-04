
ALTER TABLE public.battles ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_battles_is_private ON public.battles(is_private);

DROP POLICY IF EXISTS "Anyone can view battles" ON public.battles;

CREATE POLICY "Public battles viewable, private only by judges or participants"
ON public.battles
FOR SELECT
USING (
  is_private = false
  OR auth.uid() = challenger_id
  OR auth.uid() = opponent_id
  OR auth.uid() = judge_id
  OR auth.uid() = requested_judge_id
  OR has_role(auth.uid(), 'judge'::app_role)
  OR has_role(auth.uid(), 'trial_judge'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'dev'::app_role)
);
