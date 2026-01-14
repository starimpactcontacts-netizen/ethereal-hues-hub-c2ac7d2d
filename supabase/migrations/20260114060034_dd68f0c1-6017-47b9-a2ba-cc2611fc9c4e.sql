-- Create notifications table for in-app notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'submission_judged', 'rank_changed', 'event_starting', 'event_ended', 'achievement'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}', -- Additional data like event_id, new_rank, etc.
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
USING (auth.uid() = user_id);

-- Service role can insert (for triggers/edge functions)
CREATE POLICY "Service can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Create activity_feed table for public activity
CREATE TABLE public.activity_feed (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  activity_type TEXT NOT NULL, -- 'submission', 'rank_up', 'rank_down', 'win', 'achievement', 'new_editor'
  title TEXT NOT NULL,
  description TEXT,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

-- Everyone can view activity feed
CREATE POLICY "Anyone can view activity feed" 
ON public.activity_feed 
FOR SELECT 
USING (true);

-- Service role can insert
CREATE POLICY "Service can insert activity" 
ON public.activity_feed 
FOR INSERT 
WITH CHECK (true);

-- Index for fast queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_activity_feed_created_at ON public.activity_feed(created_at DESC);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_feed;

-- Create trigger to create notification when submission is judged
CREATE OR REPLACE FUNCTION public.notify_on_submission_scored()
RETURNS TRIGGER AS $$
DECLARE
  event_title TEXT;
  profile_username TEXT;
  profile_avatar TEXT;
BEGIN
  IF NEW.status = 'scored' AND (OLD.status IS NULL OR OLD.status != 'scored') THEN
    -- Get event title
    SELECT title INTO event_title FROM public.events WHERE id = NEW.event_id;
    
    -- Get user profile
    SELECT username, avatar_url INTO profile_username, profile_avatar 
    FROM public.profiles WHERE id = NEW.user_id;
    
    -- Create notification for user
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.user_id,
      'submission_judged',
      'Your submission has been judged!',
      'Your entry in ' || COALESCE(event_title, 'an event') || ' received a QOI score of ' || ROUND(NEW.qoi_score::NUMERIC, 1),
      jsonb_build_object(
        'event_id', NEW.event_id,
        'qoi_score', NEW.qoi_score,
        'quality_score', NEW.quality_score,
        'originality_score', NEW.originality_score,
        'impact_score', NEW.impact_score
      )
    );
    
    -- Add to activity feed
    INSERT INTO public.activity_feed (user_id, username, avatar_url, activity_type, title, description, data)
    VALUES (
      NEW.user_id,
      COALESCE(profile_username, 'Unknown'),
      profile_avatar,
      'submission',
      profile_username || ' submitted to ' || COALESCE(event_title, 'an event'),
      'Scored ' || ROUND(NEW.qoi_score::NUMERIC, 1) || ' QOI',
      jsonb_build_object('event_id', NEW.event_id, 'qoi_score', NEW.qoi_score)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_submission_scored_notify
  AFTER INSERT OR UPDATE ON public.event_participations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_submission_scored();