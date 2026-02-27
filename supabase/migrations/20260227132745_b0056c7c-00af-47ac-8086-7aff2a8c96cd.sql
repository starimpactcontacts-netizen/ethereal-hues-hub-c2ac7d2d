
-- Make user_id nullable on both tables so guests can submit
ALTER TABLE public.featured_drop_queue ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.featured_submissions ALTER COLUMN user_id DROP NOT NULL;

-- Add claim_token for guest submissions (used to link after signup)
ALTER TABLE public.featured_drop_queue ADD COLUMN IF NOT EXISTS claim_token text;
ALTER TABLE public.featured_submissions ADD COLUMN IF NOT EXISTS claim_token text;

-- Drop existing insert policies that require auth
DROP POLICY IF EXISTS "Users can submit to queue" ON public.featured_drop_queue;
DROP POLICY IF EXISTS "Users can submit to drops" ON public.featured_submissions;

-- Allow anyone (including anon) to insert into queue
CREATE POLICY "Anyone can submit to queue"
ON public.featured_drop_queue
FOR INSERT
TO public
WITH CHECK (true);

-- Allow anyone (including anon) to insert submissions
CREATE POLICY "Anyone can submit to drops"
ON public.featured_submissions
FOR INSERT
TO public
WITH CHECK (true);

-- Allow claiming: users can update their own submissions by claim_token
CREATE POLICY "Users can claim guest submissions queue"
ON public.featured_drop_queue
FOR UPDATE
TO authenticated
USING (claim_token IS NOT NULL AND user_id IS NULL)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can claim guest submissions"
ON public.featured_submissions
FOR UPDATE
TO authenticated
USING (claim_token IS NOT NULL AND user_id IS NULL)
WITH CHECK (auth.uid() = user_id);
