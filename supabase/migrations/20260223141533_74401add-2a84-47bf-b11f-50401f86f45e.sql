
-- Add song/theme pick columns to quick_fights (matching battles table pattern)
ALTER TABLE public.quick_fights
  ADD COLUMN IF NOT EXISTS theme_drop_id UUID REFERENCES public.featured_drops(id),
  ADD COLUMN IF NOT EXISTS theme_song_name TEXT,
  ADD COLUMN IF NOT EXISTS theme_song_preview_url TEXT;

-- Add thumbnail columns to quick_fights for each player's submission thumbnail
ALTER TABLE public.quick_fights
  ADD COLUMN IF NOT EXISTS player_1_thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS player_2_thumbnail_url TEXT;

-- Add thumbnail columns to battles for each participant's submission thumbnail
ALTER TABLE public.battles
  ADD COLUMN IF NOT EXISTS challenger_thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS opponent_thumbnail_url TEXT;

-- Add community vote columns to quick_fights (matching battles pattern)
ALTER TABLE public.quick_fights
  ADD COLUMN IF NOT EXISTS player_1_votes INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS player_2_votes INTEGER NOT NULL DEFAULT 0;

-- Create quick_fight_votes table for community voting
CREATE TABLE IF NOT EXISTS public.quick_fight_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fight_id UUID NOT NULL REFERENCES public.quick_fights(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  voted_for UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(fight_id, user_id)
);

ALTER TABLE public.quick_fight_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view quick fight votes"
  ON public.quick_fight_votes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote"
  ON public.quick_fight_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime for quick_fight_votes
ALTER PUBLICATION supabase_realtime ADD TABLE public.quick_fight_votes;
