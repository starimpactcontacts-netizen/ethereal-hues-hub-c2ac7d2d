
-- Enums
DO $$ BEGIN
  CREATE TYPE public.versus_inspo_status AS ENUM ('editing','voting','decided','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.versus_inspo_winner AS ENUM ('creator','inspo','tie');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.versus_inspo_vote_side AS ENUM ('creator','inspo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Battles
CREATE TABLE public.versus_inspo_battles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  creator_username text NOT NULL,
  creator_avatar_url text,
  inspo_video_url text NOT NULL,
  inspo_thumbnail_url text,
  inspo_duration_sec integer,
  inspo_source_label text,
  song_name text NOT NULL,
  song_artist text,
  title text NOT NULL,
  caption text,
  creator_submission_url text,
  creator_submission_platform text,
  creator_submission_thumbnail text,
  status public.versus_inspo_status NOT NULL DEFAULT 'editing',
  voting_started_at timestamptz,
  voting_ends_at timestamptz,
  creator_votes integer NOT NULL DEFAULT 0,
  inspo_votes integer NOT NULL DEFAULT 0,
  total_votes integer NOT NULL DEFAULT 0,
  winner public.versus_inspo_winner,
  rings_awarded integer NOT NULL DEFAULT 0,
  index_awarded integer NOT NULL DEFAULT 0,
  xp_awarded integer NOT NULL DEFAULT 0,
  views integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.versus_inspo_battles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.versus_inspo_battles TO authenticated;
GRANT ALL ON public.versus_inspo_battles TO service_role;
ALTER TABLE public.versus_inspo_battles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view live or decided versus battles"
  ON public.versus_inspo_battles FOR SELECT
  USING (status IN ('voting','decided') OR creator_id = auth.uid());

CREATE POLICY "Creators can insert their own versus battle"
  ON public.versus_inspo_battles FOR INSERT TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can update their own versus battle"
  ON public.versus_inspo_battles FOR UPDATE TO authenticated
  USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can delete their own versus battle"
  ON public.versus_inspo_battles FOR DELETE TO authenticated
  USING (creator_id = auth.uid());

-- Votes
CREATE TABLE public.versus_inspo_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id uuid NOT NULL REFERENCES public.versus_inspo_battles(id) ON DELETE CASCADE,
  voter_id uuid,
  voter_ip_hash text,
  vote public.versus_inspo_vote_side NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX versus_inspo_votes_user_uniq
  ON public.versus_inspo_votes (battle_id, voter_id) WHERE voter_id IS NOT NULL;
CREATE UNIQUE INDEX versus_inspo_votes_ip_uniq
  ON public.versus_inspo_votes (battle_id, voter_ip_hash) WHERE voter_ip_hash IS NOT NULL;
CREATE INDEX versus_inspo_votes_battle_idx ON public.versus_inspo_votes (battle_id);

GRANT SELECT, INSERT ON public.versus_inspo_votes TO authenticated;
GRANT ALL ON public.versus_inspo_votes TO service_role;
ALTER TABLE public.versus_inspo_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own votes"
  ON public.versus_inspo_votes FOR SELECT TO authenticated
  USING (voter_id = auth.uid());

CREATE POLICY "Authed users vote once on a live battle, not their own"
  ON public.versus_inspo_votes FOR INSERT TO authenticated
  WITH CHECK (
    voter_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.versus_inspo_battles b
      WHERE b.id = battle_id
        AND b.status = 'voting'
        AND b.creator_id <> auth.uid()
        AND (b.voting_ends_at IS NULL OR b.voting_ends_at > now())
    )
  );

-- Tally trigger
CREATE OR REPLACE FUNCTION public.versus_inspo_vote_tally()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.vote = 'creator' THEN
    UPDATE public.versus_inspo_battles
      SET creator_votes = creator_votes + 1,
          total_votes = total_votes + 1,
          updated_at = now()
      WHERE id = NEW.battle_id;
  ELSE
    UPDATE public.versus_inspo_battles
      SET inspo_votes = inspo_votes + 1,
          total_votes = total_votes + 1,
          updated_at = now()
      WHERE id = NEW.battle_id;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_versus_inspo_vote_tally
  AFTER INSERT ON public.versus_inspo_votes
  FOR EACH ROW EXECUTE FUNCTION public.versus_inspo_vote_tally();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.versus_inspo_touch_updated()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_versus_inspo_touch
  BEFORE UPDATE ON public.versus_inspo_battles
  FOR EACH ROW EXECUTE FUNCTION public.versus_inspo_touch_updated();

-- Close due battles + award rewards
CREATE OR REPLACE FUNCTION public.close_due_versus_inspo_battles()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r record;
  w public.versus_inspo_winner;
  rings_add int;
  index_add int;
  xp_add int;
  closed_count int := 0;
BEGIN
  FOR r IN
    SELECT * FROM public.versus_inspo_battles
    WHERE status = 'voting' AND voting_ends_at IS NOT NULL AND voting_ends_at <= now()
    FOR UPDATE SKIP LOCKED
  LOOP
    IF r.creator_votes > r.inspo_votes THEN
      w := 'creator'; rings_add := 30; index_add := 10; xp_add := 50;
    ELSIF r.inspo_votes > r.creator_votes THEN
      w := 'inspo'; rings_add := 0; index_add := 0; xp_add := 5;
    ELSE
      w := 'tie'; rings_add := 0; index_add := 0; xp_add := 10;
    END IF;

    UPDATE public.versus_inspo_battles
      SET status = 'decided',
          winner = w,
          rings_awarded = rings_add,
          index_awarded = index_add,
          xp_awarded = xp_add,
          updated_at = now()
      WHERE id = r.id;

    -- Reward creator profile
    UPDATE public.profiles
      SET rings = COALESCE(rings,0) + rings_add,
          global_index_score = COALESCE(global_index_score,0) + index_add,
          spendable_index = COALESCE(spendable_index,0) + index_add,
          total_xp = COALESCE(total_xp,0) + xp_add
      WHERE id = r.creator_id;

    -- Notification
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      r.creator_id,
      'versus_inspo_decided',
      CASE w WHEN 'creator' THEN 'You beat the inspo!'
             WHEN 'inspo' THEN 'Inspo won this round'
             ELSE 'Versus Inspo tied' END,
      CASE w WHEN 'creator' THEN 'Your edit won the public vote. +30 Rings, +10 Index, +50 XP.'
             WHEN 'inspo' THEN 'Inspo edged you out. +5 XP — try again.'
             ELSE 'Dead heat. +10 XP.' END,
      '/versus/' || r.id::text
    );

    closed_count := closed_count + 1;
  END LOOP;
  RETURN closed_count;
END $$;

GRANT EXECUTE ON FUNCTION public.close_due_versus_inspo_battles() TO service_role, authenticated;
