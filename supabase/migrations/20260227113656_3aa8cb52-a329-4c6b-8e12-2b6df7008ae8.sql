
-- Add insert policy for email log (system inserts via service role, users only read their own)
CREATE POLICY "Service role can insert email logs"
  ON public.email_notifications_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);
