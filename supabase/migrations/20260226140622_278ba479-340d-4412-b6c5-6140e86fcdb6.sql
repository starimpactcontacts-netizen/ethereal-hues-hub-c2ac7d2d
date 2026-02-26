
-- Solo Mode submissions table
CREATE TABLE public.solo_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  username TEXT NOT NULL,
  avatar_url TEXT,
  
  -- Song / Theme
  drop_id UUID REFERENCES public.featured_drops(id),
  song_name TEXT NOT NULL,
  artist_name TEXT,
  theme TEXT NOT NULL,
  
  -- Submission
  submission_url TEXT,
  submission_platform TEXT,
  thumbnail_url TEXT,
  video_title TEXT,
  submitted_at TIMESTAMPTZ,
  
  -- Judge scoring
  judge_id UUID REFERENCES public.profiles(id),
  judge_claimed_at TIMESTAMPTZ,
  quality_score NUMERIC,
  originality_score NUMERIC,
  impact_score NUMERIC,
  qoi_score NUMERIC,
  judge_notes TEXT,
  judged_at TIMESTAMPTZ,
  
  -- Index reward
  index_awarded INTEGER DEFAULT 0,
  
  -- Status: picking_song | editing | submitted | judging | scored
  status TEXT NOT NULL DEFAULT 'picking_song',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.solo_submissions ENABLE ROW LEVEL SECURITY;

-- Users can read all scored submissions (leaderboard) and their own
CREATE POLICY "Users can view own solo submissions"
  ON public.solo_submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view scored solo submissions"
  ON public.solo_submissions FOR SELECT
  USING (status = 'scored');

CREATE POLICY "Users can create own solo submissions"
  ON public.solo_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own solo submissions"
  ON public.solo_submissions FOR UPDATE
  USING (auth.uid() = user_id);

-- Judges can view submitted entries
CREATE POLICY "Judges can view submitted solo entries"
  ON public.solo_submissions FOR SELECT
  USING (status IN ('submitted', 'judging', 'scored'));

-- Judges can update for scoring
CREATE POLICY "Judges can score solo submissions"
  ON public.solo_submissions FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('judge', 'trial_judge', 'admin'))
  );

-- Index for leaderboard queries
CREATE INDEX idx_solo_submissions_drop_score ON public.solo_submissions(drop_id, qoi_score DESC NULLS LAST) WHERE status = 'scored';
CREATE INDEX idx_solo_submissions_user ON public.solo_submissions(user_id, created_at DESC);
CREATE INDEX idx_solo_submissions_status ON public.solo_submissions(status);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.solo_submissions;

-- Award index on scoring
CREATE OR REPLACE FUNCTION public.award_solo_index()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'scored' AND NEW.qoi_score IS NOT NULL AND (OLD.status IS NULL OR OLD.status != 'scored') THEN
    -- Index awarded = floor of QOI score (up to 100+)
    NEW.index_awarded := FLOOR(NEW.qoi_score)::INTEGER;
    
    -- Add to user's spendable and global index
    UPDATE public.profiles
    SET spendable_index = spendable_index + NEW.index_awarded,
        global_index_score = COALESCE(global_index_score, 0) + NEW.index_awarded
    WHERE id = NEW.user_id;
    
    -- Award XP too
    PERFORM public.award_xp(NEW.user_id, LEAST(NEW.index_awarded, 50), 'solo_scored', 'Solo Mode: Scored ' || ROUND(NEW.qoi_score::NUMERIC, 1) || ' QOI');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_solo_submission_scored
  BEFORE UPDATE ON public.solo_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.award_solo_index();
