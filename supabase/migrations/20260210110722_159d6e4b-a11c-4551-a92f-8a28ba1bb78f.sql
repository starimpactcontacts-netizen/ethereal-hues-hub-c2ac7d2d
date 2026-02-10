
-- ═══════════════════════════════════════════════════
-- JUDGE MISSIONS SYSTEM
-- Daily + Weekly tasks that reward JXP
-- ═══════════════════════════════════════════════════

-- Mission templates (the task definitions)
CREATE TABLE public.judge_mission_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  mission_type TEXT NOT NULL DEFAULT 'daily', -- 'daily' or 'weekly'
  action_type TEXT NOT NULL, -- 'review_edits', 'post_video', 'comment_reviews', 'helpful_verdict'
  target_count INT NOT NULL DEFAULT 1,
  jxp_reward INT NOT NULL DEFAULT 25,
  icon TEXT DEFAULT 'target',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.judge_mission_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active mission templates"
ON public.judge_mission_templates FOR SELECT
USING (is_active = true);

-- Mission progress (per judge, per mission, per period)
CREATE TABLE public.judge_mission_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  judge_id UUID NOT NULL,
  mission_id UUID NOT NULL REFERENCES public.judge_mission_templates(id) ON DELETE CASCADE,
  period_start DATE NOT NULL, -- the day (for daily) or week start (for weekly)
  current_count INT NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  jxp_claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(judge_id, mission_id, period_start)
);

ALTER TABLE public.judge_mission_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Judges can view their own mission progress"
ON public.judge_mission_progress FOR SELECT
USING (auth.uid() = judge_id);

CREATE POLICY "Judges can insert their own mission progress"
ON public.judge_mission_progress FOR INSERT
WITH CHECK (auth.uid() = judge_id);

CREATE POLICY "Judges can update their own mission progress"
ON public.judge_mission_progress FOR UPDATE
USING (auth.uid() = judge_id);

-- ═══════════════════════════════════════════════════
-- JUDGE DIVISIONS (Seasonal Ranking)
-- Iron → Bronze → Silver → Gold → Onyx → Legendary
-- ═══════════════════════════════════════════════════

CREATE TABLE public.judge_seasons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  season_number INT NOT NULL,
  season_name TEXT NOT NULL, -- e.g. 'Season 1 — The Awakening'
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.judge_seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view seasons"
ON public.judge_seasons FOR SELECT
USING (true);

CREATE TABLE public.judge_division_standings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  judge_id UUID NOT NULL,
  season_id UUID NOT NULL REFERENCES public.judge_seasons(id) ON DELETE CASCADE,
  division TEXT NOT NULL DEFAULT 'iron', -- iron, bronze, silver, gold, onyx, legendary
  seasonal_jxp INT NOT NULL DEFAULT 0,
  reviews_this_season INT NOT NULL DEFAULT 0,
  videos_this_season INT NOT NULL DEFAULT 0,
  peak_division TEXT DEFAULT 'iron',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(judge_id, season_id)
);

ALTER TABLE public.judge_division_standings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view division standings"
ON public.judge_division_standings FOR SELECT
USING (true);

CREATE POLICY "Judges can insert own standings"
ON public.judge_division_standings FOR INSERT
WITH CHECK (auth.uid() = judge_id);

CREATE POLICY "Judges can update own standings"
ON public.judge_division_standings FOR UPDATE
USING (auth.uid() = judge_id);

-- ═══════════════════════════════════════════════════
-- JUDGE SPOTLIGHT (Daily recognition)
-- ═══════════════════════════════════════════════════

CREATE TABLE public.judge_spotlights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  judge_id UUID NOT NULL,
  spotlight_date DATE NOT NULL,
  spotlight_type TEXT NOT NULL, -- 'most_reviews', 'most_viral', 'highest_jxp', 'most_controversial'
  stat_value INT NOT NULL DEFAULT 0,
  headline TEXT, -- e.g. "Filed 12 verdicts in 24 hours"
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(spotlight_date, spotlight_type)
);

ALTER TABLE public.judge_spotlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view spotlights"
ON public.judge_spotlights FOR SELECT
USING (true);

-- Seed the first season
INSERT INTO public.judge_seasons (season_number, season_name, starts_at, ends_at, is_active)
VALUES (1, 'Season 1 — Genesis', now(), now() + interval '3 months', true);

-- Seed mission templates
INSERT INTO public.judge_mission_templates (title, description, mission_type, action_type, target_count, jxp_reward, icon) VALUES
('File 5 Verdicts', 'Review 5 edits today', 'daily', 'review_edits', 5, 50, 'gavel'),
('Post a Rating Video', 'Upload 1 rating video to TikTok/IG/YT', 'daily', 'post_video', 1, 25, 'video'),
('Comment on 3 Verdicts', 'Leave feedback on 3 other reviews', 'daily', 'comment_reviews', 3, 10, 'message'),
('File 25 Verdicts', 'Complete 25 reviews this week', 'weekly', 'review_edits', 25, 200, 'trophy'),
('Post 5 Rating Videos', 'Upload 5 rating videos this week', 'weekly', 'post_video', 5, 150, 'flame'),
('Win Most Helpful', 'Get the most upvoted verdict this week', 'weekly', 'helpful_verdict', 1, 75, 'star');

-- Add realtime for mission progress
ALTER PUBLICATION supabase_realtime ADD TABLE public.judge_mission_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE public.judge_spotlights;
