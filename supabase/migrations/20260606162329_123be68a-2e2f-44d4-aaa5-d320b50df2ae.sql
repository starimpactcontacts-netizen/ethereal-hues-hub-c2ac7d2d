
-- ===== TABLES =====
CREATE TABLE public.solo_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  video_url TEXT NOT NULL,
  platform TEXT NOT NULL,
  title TEXT,
  caption TEXT,
  thumbnail_url TEXT,
  total_ratings INTEGER NOT NULL DEFAULT 0,
  avg_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  rings_earned INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_solo_shares_user ON public.solo_shares(user_id);
CREATE INDEX idx_solo_shares_created ON public.solo_shares(created_at DESC);

GRANT SELECT ON public.solo_shares TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.solo_shares TO authenticated;
GRANT ALL ON public.solo_shares TO service_role;

ALTER TABLE public.solo_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "solo_shares public read"
  ON public.solo_shares FOR SELECT
  USING (is_active = true OR auth.uid() = user_id);

CREATE POLICY "solo_shares owner insert"
  ON public.solo_shares FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "solo_shares owner update"
  ON public.solo_shares FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "solo_shares owner delete"
  ON public.solo_shares FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ===== RATINGS =====
CREATE TABLE public.solo_share_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id UUID NOT NULL REFERENCES public.solo_shares(id) ON DELETE CASCADE,
  rater_user_id UUID,
  rater_nickname TEXT,
  rater_ip_hash TEXT NOT NULL,
  stars SMALLINT NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT solo_share_ratings_stars_range CHECK (stars BETWEEN 1 AND 5),
  CONSTRAINT solo_share_ratings_unique_per_ip UNIQUE (share_id, rater_ip_hash)
);
CREATE INDEX idx_solo_share_ratings_share ON public.solo_share_ratings(share_id, created_at DESC);

GRANT SELECT, INSERT ON public.solo_share_ratings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.solo_share_ratings TO authenticated;
GRANT ALL ON public.solo_share_ratings TO service_role;

ALTER TABLE public.solo_share_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "solo_share_ratings public read"
  ON public.solo_share_ratings FOR SELECT
  USING (true);

-- Anyone can rate, but not your own share
CREATE POLICY "solo_share_ratings public insert"
  ON public.solo_share_ratings FOR INSERT
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM public.solo_shares s
      WHERE s.id = share_id AND s.user_id IS NOT DISTINCT FROM auth.uid()
    )
  );

-- ===== TRIGGER: award rings + update stats =====
CREATE OR REPLACE FUNCTION public.solo_share_after_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner UUID;
  v_current_rings INTEGER;
  v_award INTEGER;
BEGIN
  SELECT user_id, rings_earned INTO v_owner, v_current_rings
  FROM public.solo_shares WHERE id = NEW.share_id;

  -- award = stars, capped so per-share total never exceeds 100
  v_award := LEAST(NEW.stars, GREATEST(0, 100 - v_current_rings));

  UPDATE public.solo_shares
  SET total_ratings = total_ratings + 1,
      avg_rating = ROUND(((avg_rating * total_ratings) + NEW.stars)::numeric / (total_ratings + 1), 2),
      rings_earned = rings_earned + v_award,
      updated_at = now()
  WHERE id = NEW.share_id;

  IF v_award > 0 AND v_owner IS NOT NULL THEN
    UPDATE public.profiles
    SET rings = rings + v_award
    WHERE id = v_owner;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_solo_share_after_rating
AFTER INSERT ON public.solo_share_ratings
FOR EACH ROW EXECUTE FUNCTION public.solo_share_after_rating();

-- updated_at touch
CREATE OR REPLACE FUNCTION public.touch_solo_share() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_solo_share_touch BEFORE UPDATE ON public.solo_shares
FOR EACH ROW EXECUTE FUNCTION public.touch_solo_share();
