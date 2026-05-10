-- Allow anyone (including guests) to read mission_submission rows for transparency counts
CREATE POLICY "Anyone can view mission submission counts"
ON public.mission_submissions
FOR SELECT
TO anon, authenticated
USING (true);
