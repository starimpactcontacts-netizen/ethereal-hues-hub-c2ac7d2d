-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Anyone can view completed reviews" ON public.review_requests;

-- Create a new policy that allows:
-- 1. Users to see their own requests (any status)
-- 2. Judges/admins/devs to see ALL requests (so they can pick up pending ones)
-- 3. Anyone to see completed/reviewed requests (for public feed)
CREATE POLICY "Users and judges can view review requests"
ON public.review_requests
FOR SELECT
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'judge'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'dev'::app_role)
  OR status = 'reviewed'
);