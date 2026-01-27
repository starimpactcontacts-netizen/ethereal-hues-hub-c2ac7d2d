-- Allow users to assign themselves ONLY the trial_judge role during onboarding
CREATE POLICY "Users can self-assign trial_judge role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND role = 'trial_judge'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'trial_judge'
  )
);