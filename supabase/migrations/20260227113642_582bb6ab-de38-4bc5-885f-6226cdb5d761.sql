
-- Add notification email & preferences to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS notification_email TEXT,
  ADD COLUMN IF NOT EXISTS notify_scores BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_battles BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_drops BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_connections BOOLEAN NOT NULL DEFAULT true;

-- Create email log table to prevent spam
CREATE TABLE IF NOT EXISTS public.email_notifications_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resend_id TEXT
);

ALTER TABLE public.email_notifications_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email logs"
  ON public.email_notifications_log FOR SELECT
  USING (auth.uid() = user_id);

-- Index for dedup checks
CREATE INDEX IF NOT EXISTS idx_email_log_user_type ON public.email_notifications_log (user_id, email_type, sent_at DESC);

-- Enable realtime for profiles notification changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.email_notifications_log;
