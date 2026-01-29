-- Participants table (editors who "joined" before submitting)
CREATE TABLE public.hosted_competition_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.hosted_competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_ready BOOLEAN DEFAULT false,
  UNIQUE(competition_id, user_id)
);

-- Enable RLS
ALTER TABLE public.hosted_competition_participants ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view participants" ON public.hosted_competition_participants
FOR SELECT USING (true);

CREATE POLICY "Users can join competitions" ON public.hosted_competition_participants
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave competitions" ON public.hosted_competition_participants
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can update own participation" ON public.hosted_competition_participants
FOR UPDATE USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.hosted_competition_participants;

-- Add view tracking and activity columns to hosted_competitions
ALTER TABLE public.hosted_competitions 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS participant_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT false;

-- Create function to increment view count
CREATE OR REPLACE FUNCTION public.increment_hosted_comp_views(comp_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE hosted_competitions
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = comp_id;
END;
$$;

-- Trigger to sync participant count
CREATE OR REPLACE FUNCTION public.sync_hosted_comp_participant_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  comp_id UUID;
  new_count INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    comp_id := OLD.competition_id;
  ELSE
    comp_id := NEW.competition_id;
  END IF;

  SELECT COUNT(*) INTO new_count
  FROM hosted_competition_participants
  WHERE competition_id = comp_id;

  UPDATE hosted_competitions
  SET participant_count = new_count
  WHERE id = comp_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER sync_hosted_comp_participants
AFTER INSERT OR DELETE ON public.hosted_competition_participants
FOR EACH ROW EXECUTE FUNCTION public.sync_hosted_comp_participant_count();

-- Add scoring_mode to submissions for flexible judging
ALTER TABLE public.hosted_competition_submissions
ADD COLUMN IF NOT EXISTS creativity_score INTEGER,
ADD COLUMN IF NOT EXISTS quality_score INTEGER,
ADD COLUMN IF NOT EXISTS impact_score INTEGER,
ADD COLUMN IF NOT EXISTS is_winner BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS winner_place INTEGER;

-- System messages for chat (automated logs)
ALTER TABLE public.hosted_comp_messages
ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'chat';

-- Function to post system message
CREATE OR REPLACE FUNCTION public.post_hosted_comp_system_message(
  p_competition_id UUID,
  p_message TEXT,
  p_message_type TEXT DEFAULT 'system'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO hosted_comp_messages (competition_id, user_id, username, message_text, is_system, message_type)
  VALUES (p_competition_id, '00000000-0000-0000-0000-000000000000'::uuid, 'System', p_message, true, p_message_type);
END;
$$;

-- Trigger: Auto post when someone joins
CREATE OR REPLACE FUNCTION public.hosted_comp_join_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.post_hosted_comp_system_message(
    NEW.competition_id,
    '@' || NEW.username || ' joined the competition',
    'join'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_hosted_comp_join
AFTER INSERT ON public.hosted_competition_participants
FOR EACH ROW EXECUTE FUNCTION public.hosted_comp_join_notification();

-- Trigger: Auto post when someone submits
CREATE OR REPLACE FUNCTION public.hosted_comp_submission_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.post_hosted_comp_system_message(
    NEW.competition_id,
    '@' || NEW.username || ' submitted an edit 🔥',
    'submission'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_hosted_comp_submission
AFTER INSERT ON public.hosted_competition_submissions
FOR EACH ROW EXECUTE FUNCTION public.hosted_comp_submission_notification();