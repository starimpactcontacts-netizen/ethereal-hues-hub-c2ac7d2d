-- Add INSERT policy for notifications table
-- Allow admins to insert notifications for any user (for broadcast)
CREATE POLICY "Admins can insert notifications for any user"
ON public.notifications
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'dev')
  )
  OR auth.uid() = user_id
);

-- Also allow the system/service role to insert (for triggers)
-- This is handled by the existing trigger functions with SECURITY DEFINER