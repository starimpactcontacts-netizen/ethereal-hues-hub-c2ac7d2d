-- Fix quick_fights RLS: allow judges/admins/devs to update (claim & judge) fights
DROP POLICY IF EXISTS "Participants can update their fight" ON public.quick_fights;

CREATE POLICY "Participants and judges can update fights"
ON public.quick_fights
FOR UPDATE
USING (
  (auth.uid() = player_1_id) 
  OR (auth.uid() = player_2_id) 
  OR (auth.uid() = judge_id)
  OR has_role(auth.uid(), 'judge'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'dev'::app_role)
  OR has_role(auth.uid(), 'trial_judge'::app_role)
);