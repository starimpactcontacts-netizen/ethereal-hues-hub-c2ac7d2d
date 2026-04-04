
-- New competitions table (open lobby model)
CREATE TABLE public.competitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  theme TEXT,
  creator_id UUID NOT NULL,
  creator_username TEXT NOT NULL,
  creator_avatar_url TEXT,
  league TEXT NOT NULL DEFAULT 'open',
  scoring_mode TEXT NOT NULL DEFAULT 'judged',
  max_players INTEGER NOT NULL DEFAULT 100,
  current_players INTEGER NOT NULL DEFAULT 0,
  cover_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'lobby',
  started_at TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  index_reward_pool INTEGER NOT NULL DEFAULT 0,
  slug TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view competitions"
  ON public.competitions FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create competitions"
  ON public.competitions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own competitions"
  ON public.competitions FOR UPDATE TO authenticated
  USING (auth.uid() = creator_id);

-- Auto-generate slug
CREATE OR REPLACE FUNCTION public.generate_competition_slug()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  IF NEW.slug IS NOT NULL AND (TG_OP = 'UPDATE' AND OLD.name = NEW.name) THEN
    RETURN NEW;
  END IF;
  base_slug := lower(regexp_replace(regexp_replace(NEW.name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  base_slug := substring(base_slug from 1 for 50);
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.competitions WHERE slug = final_slug AND id != NEW.id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_competition_slug
  BEFORE INSERT OR UPDATE ON public.competitions
  FOR EACH ROW EXECUTE FUNCTION public.generate_competition_slug();

-- Auto-update updated_at
CREATE TRIGGER update_competitions_updated_at
  BEFORE UPDATE ON public.competitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Participants table
CREATE TABLE public.competition_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(competition_id, user_id)
);

ALTER TABLE public.competition_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view participants"
  ON public.competition_participants FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join"
  ON public.competition_participants FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave"
  ON public.competition_participants FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Sync participant count
CREATE OR REPLACE FUNCTION public.sync_competition_player_count()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  comp_id UUID;
  new_count INTEGER;
BEGIN
  comp_id := COALESCE(NEW.competition_id, OLD.competition_id);
  SELECT COUNT(*) INTO new_count FROM public.competition_participants WHERE competition_id = comp_id;
  UPDATE public.competitions SET current_players = new_count WHERE id = comp_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_sync_competition_players
  AFTER INSERT OR DELETE ON public.competition_participants
  FOR EACH ROW EXECUTE FUNCTION public.sync_competition_player_count();

-- Auto-calculate index reward pool based on player count
CREATE OR REPLACE FUNCTION public.update_competition_reward_pool()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.competitions
  SET index_reward_pool = CASE
    WHEN current_players >= 100 THEN 500
    WHEN current_players >= 75 THEN 350
    WHEN current_players >= 50 THEN 200
    WHEN current_players >= 25 THEN 100
    WHEN current_players >= 10 THEN 50
    WHEN current_players >= 5 THEN 25
    WHEN current_players >= 2 THEN 10
    ELSE 0
  END
  WHERE id = COALESCE(NEW.competition_id, OLD.competition_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_update_competition_rewards
  AFTER INSERT OR DELETE ON public.competition_participants
  FOR EACH ROW EXECUTE FUNCTION public.update_competition_reward_pool();

-- Submissions table
CREATE TABLE public.competition_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  submission_url TEXT NOT NULL,
  platform TEXT DEFAULT 'tiktok',
  score INTEGER,
  judge_notes TEXT,
  is_winner BOOLEAN DEFAULT false,
  winner_place INTEGER,
  scored_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(competition_id, user_id)
);

ALTER TABLE public.competition_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view submissions"
  ON public.competition_submissions FOR SELECT USING (true);

CREATE POLICY "Authenticated users can submit"
  ON public.competition_submissions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own submissions"
  ON public.competition_submissions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.competitions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.competition_participants;
