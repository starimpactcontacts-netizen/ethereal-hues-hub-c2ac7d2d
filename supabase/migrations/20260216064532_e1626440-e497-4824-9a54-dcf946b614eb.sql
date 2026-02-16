
-- Featured Artists system
CREATE TABLE public.featured_artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  genre TEXT DEFAULT 'phonk',
  social_links JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Featured Drops (each song/challenge from an artist)
CREATE TABLE public.featured_drops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.featured_artists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  song_name TEXT NOT NULL,
  song_url TEXT,
  song_preview_url TEXT,
  poster_url TEXT,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'live', 'judging', 'closed')),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  xp_reward INTEGER DEFAULT 30,
  index_reward INTEGER DEFAULT 15,
  mystery_reward_label TEXT DEFAULT '???',
  submission_count INTEGER DEFAULT 0,
  top_score NUMERIC DEFAULT 0,
  top_scorer_id UUID,
  top_scorer_username TEXT,
  random_pick_id UUID,
  random_pick_username TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Featured Submissions (user entries for a drop)
CREATE TABLE public.featured_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id UUID NOT NULL REFERENCES public.featured_drops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  username TEXT NOT NULL,
  avatar_url TEXT,
  submission_url TEXT NOT NULL,
  platform TEXT DEFAULT 'tiktok',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scored', 'rejected')),
  qoi_score NUMERIC,
  quality_score NUMERIC,
  originality_score NUMERIC,
  impact_score NUMERIC,
  feedback TEXT,
  judge_id UUID,
  judge_username TEXT,
  xp_awarded INTEGER DEFAULT 0,
  index_awarded INTEGER DEFAULT 0,
  judged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(drop_id, user_id)
);

-- Enable RLS
ALTER TABLE public.featured_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_drops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_submissions ENABLE ROW LEVEL SECURITY;

-- Public read for artists and drops
CREATE POLICY "Anyone can view featured artists" ON public.featured_artists FOR SELECT USING (true);
CREATE POLICY "Anyone can view featured drops" ON public.featured_drops FOR SELECT USING (true);
CREATE POLICY "Anyone can view featured submissions" ON public.featured_submissions FOR SELECT USING (true);

-- Only admins can manage artists/drops (via has_role or dev auth check)
CREATE POLICY "Admins can manage artists" ON public.featured_artists FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));
CREATE POLICY "Admins can manage drops" ON public.featured_drops FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

-- Users can submit their own entries
CREATE POLICY "Users can submit to drops" ON public.featured_submissions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can manage all submissions (scoring)
CREATE POLICY "Admins can manage submissions" ON public.featured_submissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev') OR public.has_role(auth.uid(), 'judge'));

-- Users can view their own submissions
CREATE POLICY "Users can view own submissions" ON public.featured_submissions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Trigger to update submission count on drop
CREATE OR REPLACE FUNCTION public.sync_featured_drop_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.featured_drops SET submission_count = submission_count + 1 WHERE id = NEW.drop_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.featured_drops SET submission_count = GREATEST(submission_count - 1, 0) WHERE id = OLD.drop_id;
  END IF;
  
  -- Update top scorer
  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.status = 'scored' AND NEW.qoi_score IS NOT NULL THEN
    UPDATE public.featured_drops fd
    SET top_score = sub.max_qoi,
        top_scorer_id = sub.best_user_id,
        top_scorer_username = sub.best_username
    FROM (
      SELECT fs.drop_id, fs.qoi_score as max_qoi, fs.user_id as best_user_id, fs.username as best_username
      FROM public.featured_submissions fs
      WHERE fs.drop_id = NEW.drop_id AND fs.status = 'scored'
      ORDER BY fs.qoi_score DESC
      LIMIT 1
    ) sub
    WHERE fd.id = NEW.drop_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER on_featured_submission_change
  AFTER INSERT OR UPDATE OR DELETE ON public.featured_submissions
  FOR EACH ROW EXECUTE FUNCTION public.sync_featured_drop_stats();

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.featured_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.featured_drops;
