-- Allow anyone to view user roles for public badge display
CREATE POLICY "Anyone can view user roles"
ON public.user_roles
FOR SELECT
USING (true);