
-- Scenepack pool (curated)
CREATE TABLE public.scenepack_pool (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  series text,
  preview_video_url text,
  thumbnail_url text,
  scenepack_youtube_url text,
  scenepack_gdrive_url text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.scenepack_pool ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scenepack_pool readable by all" ON public.scenepack_pool FOR SELECT USING (true);
CREATE POLICY "scenepack_pool admin write" ON public.scenepack_pool FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Battle columns
ALTER TABLE public.battles
  ADD COLUMN IF NOT EXISTS scenepack_option_a_id uuid REFERENCES public.scenepack_pool(id),
  ADD COLUMN IF NOT EXISTS scenepack_option_b_id uuid REFERENCES public.scenepack_pool(id),
  ADD COLUMN IF NOT EXISTS scenepack_vote_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS scenepack_vote_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS challenger_scenepack_vote uuid,
  ADD COLUMN IF NOT EXISTS opponent_scenepack_vote uuid,
  ADD COLUMN IF NOT EXISTS scenepack_locked_id uuid REFERENCES public.scenepack_pool(id),
  ADD COLUMN IF NOT EXISTS scenepack_youtube_url text,
  ADD COLUMN IF NOT EXISTS scenepack_gdrive_url text,
  ADD COLUMN IF NOT EXISTS scenepack_url text;

ALTER TABLE public.cash_battles
  ADD COLUMN IF NOT EXISTS scenepack_option_a_id uuid REFERENCES public.scenepack_pool(id),
  ADD COLUMN IF NOT EXISTS scenepack_option_b_id uuid REFERENCES public.scenepack_pool(id),
  ADD COLUMN IF NOT EXISTS scenepack_vote_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS scenepack_vote_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS challenger_scenepack_vote uuid,
  ADD COLUMN IF NOT EXISTS opponent_scenepack_vote uuid,
  ADD COLUMN IF NOT EXISTS scenepack_locked_id uuid REFERENCES public.scenepack_pool(id);

-- Helper: pick 2 random active scenepacks
CREATE OR REPLACE FUNCTION public.pick_random_scenepack_pair()
RETURNS TABLE (a uuid, b uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE picked uuid[];
BEGIN
  SELECT array_agg(id) INTO picked FROM (
    SELECT id FROM public.scenepack_pool WHERE active = true ORDER BY random() LIMIT 2
  ) s;
  IF picked IS NULL OR array_length(picked, 1) < 2 THEN
    RETURN;
  END IF;
  a := picked[1]; b := picked[2];
  RETURN NEXT;
END;
$$;

-- Resolve vote: pick winner, copy URLs onto battle row
CREATE OR REPLACE FUNCTION public.resolve_scenepack_vote(p_battle_id uuid, p_is_cash boolean DEFAULT false)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_a uuid; v_b uuid; v_ca uuid; v_op uuid; v_locked uuid; v_winner uuid;
  v_ct_a int := 0; v_ct_b int := 0;
  v_yt text; v_gd text; v_pv text;
BEGIN
  IF p_is_cash THEN
    SELECT scenepack_option_a_id, scenepack_option_b_id, challenger_scenepack_vote, opponent_scenepack_vote, scenepack_locked_id
      INTO v_a, v_b, v_ca, v_op, v_locked FROM public.cash_battles WHERE id = p_battle_id FOR UPDATE;
  ELSE
    SELECT scenepack_option_a_id, scenepack_option_b_id, challenger_scenepack_vote, opponent_scenepack_vote, scenepack_locked_id
      INTO v_a, v_b, v_ca, v_op, v_locked FROM public.battles WHERE id = p_battle_id FOR UPDATE;
  END IF;

  IF v_locked IS NOT NULL THEN RETURN v_locked; END IF;
  IF v_a IS NULL OR v_b IS NULL THEN RETURN NULL; END IF;

  IF v_ca = v_a THEN v_ct_a := v_ct_a + 1; ELSIF v_ca = v_b THEN v_ct_b := v_ct_b + 1; END IF;
  IF v_op = v_a THEN v_ct_a := v_ct_a + 1; ELSIF v_op = v_b THEN v_ct_b := v_ct_b + 1; END IF;

  IF v_ct_a > v_ct_b THEN
    v_winner := v_a;
  ELSIF v_ct_b > v_ct_a THEN
    v_winner := v_b;
  ELSE
    -- tie (0-0 or 1-1): coin flip
    v_winner := CASE WHEN random() < 0.5 THEN v_a ELSE v_b END;
  END IF;

  SELECT scenepack_youtube_url, scenepack_gdrive_url, preview_video_url
    INTO v_yt, v_gd, v_pv FROM public.scenepack_pool WHERE id = v_winner;

  IF p_is_cash THEN
    UPDATE public.cash_battles SET
      scenepack_locked_id = v_winner,
      scenepack_youtube_url = v_yt,
      scenepack_gdrive_url = v_gd,
      scenepack_url = COALESCE(v_yt, v_gd, v_pv)
    WHERE id = p_battle_id;
  ELSE
    UPDATE public.battles SET
      scenepack_locked_id = v_winner,
      scenepack_youtube_url = v_yt,
      scenepack_gdrive_url = v_gd,
      scenepack_url = COALESCE(v_yt, v_gd, v_pv)
    WHERE id = p_battle_id;
  END IF;

  RETURN v_winner;
END;
$$;

-- Cast vote and auto-resolve if both voted or deadline passed
CREATE OR REPLACE FUNCTION public.cast_scenepack_vote(p_battle_id uuid, p_scenepack_id uuid, p_is_cash boolean DEFAULT false)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_challenger uuid; v_opponent uuid; v_a uuid; v_b uuid;
  v_ca uuid; v_op uuid; v_deadline timestamptz; v_locked uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;

  IF p_is_cash THEN
    SELECT challenger_id, opponent_id, scenepack_option_a_id, scenepack_option_b_id, challenger_scenepack_vote, opponent_scenepack_vote, scenepack_vote_deadline, scenepack_locked_id
      INTO v_challenger, v_opponent, v_a, v_b, v_ca, v_op, v_deadline, v_locked FROM public.cash_battles WHERE id = p_battle_id FOR UPDATE;
  ELSE
    SELECT challenger_id, opponent_id, scenepack_option_a_id, scenepack_option_b_id, challenger_scenepack_vote, opponent_scenepack_vote, scenepack_vote_deadline, scenepack_locked_id
      INTO v_challenger, v_opponent, v_a, v_b, v_ca, v_op, v_deadline, v_locked FROM public.battles WHERE id = p_battle_id FOR UPDATE;
  END IF;

  IF v_locked IS NOT NULL THEN RETURN v_locked; END IF;
  IF p_scenepack_id NOT IN (v_a, v_b) THEN RAISE EXCEPTION 'invalid pick'; END IF;
  IF v_user NOT IN (v_challenger, v_opponent) THEN RAISE EXCEPTION 'not a participant'; END IF;

  IF v_user = v_challenger THEN
    v_ca := p_scenepack_id;
    IF p_is_cash THEN UPDATE public.cash_battles SET challenger_scenepack_vote = p_scenepack_id WHERE id = p_battle_id;
    ELSE UPDATE public.battles SET challenger_scenepack_vote = p_scenepack_id WHERE id = p_battle_id; END IF;
  ELSE
    v_op := p_scenepack_id;
    IF p_is_cash THEN UPDATE public.cash_battles SET opponent_scenepack_vote = p_scenepack_id WHERE id = p_battle_id;
    ELSE UPDATE public.battles SET opponent_scenepack_vote = p_scenepack_id WHERE id = p_battle_id; END IF;
  END IF;

  -- both voted? resolve now
  IF v_ca IS NOT NULL AND v_op IS NOT NULL THEN
    RETURN public.resolve_scenepack_vote(p_battle_id, p_is_cash);
  END IF;

  -- deadline passed? resolve
  IF v_deadline IS NOT NULL AND now() >= v_deadline THEN
    RETURN public.resolve_scenepack_vote(p_battle_id, p_is_cash);
  END IF;

  RETURN NULL;
END;
$$;

-- Public function to resolve if expired (any spectator can poke it)
CREATE OR REPLACE FUNCTION public.resolve_scenepack_if_expired(p_battle_id uuid, p_is_cash boolean DEFAULT false)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_deadline timestamptz; v_locked uuid;
BEGIN
  IF p_is_cash THEN
    SELECT scenepack_vote_deadline, scenepack_locked_id INTO v_deadline, v_locked FROM public.cash_battles WHERE id = p_battle_id;
  ELSE
    SELECT scenepack_vote_deadline, scenepack_locked_id INTO v_deadline, v_locked FROM public.battles WHERE id = p_battle_id;
  END IF;
  IF v_locked IS NOT NULL THEN RETURN v_locked; END IF;
  IF v_deadline IS NULL OR now() < v_deadline THEN RETURN NULL; END IF;
  RETURN public.resolve_scenepack_vote(p_battle_id, p_is_cash);
END;
$$;

-- Trigger: when battle becomes active, assign 2 random scenepacks + 30s deadline
CREATE OR REPLACE FUNCTION public.trg_assign_scenepack_options()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_pair record;
BEGIN
  IF NEW.scenepack_option_a_id IS NOT NULL THEN RETURN NEW; END IF;
  IF (TG_TABLE_NAME = 'battles' AND NEW.status = 'active' AND (OLD.status IS DISTINCT FROM 'active'))
     OR (TG_TABLE_NAME = 'cash_battles' AND NEW.status IN ('live','active') AND (OLD.status IS DISTINCT FROM NEW.status)) THEN
    SELECT * INTO v_pair FROM public.pick_random_scenepack_pair();
    IF v_pair.a IS NOT NULL THEN
      NEW.scenepack_option_a_id := v_pair.a;
      NEW.scenepack_option_b_id := v_pair.b;
      NEW.scenepack_vote_started_at := now();
      NEW.scenepack_vote_deadline := now() + interval '30 seconds';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_scenepack_battles ON public.battles;
CREATE TRIGGER trg_assign_scenepack_battles
  BEFORE UPDATE ON public.battles
  FOR EACH ROW EXECUTE FUNCTION public.trg_assign_scenepack_options();

DROP TRIGGER IF EXISTS trg_assign_scenepack_cash_battles ON public.cash_battles;
CREATE TRIGGER trg_assign_scenepack_cash_battles
  BEFORE UPDATE ON public.cash_battles
  FOR EACH ROW EXECUTE FUNCTION public.trg_assign_scenepack_options();

-- Storage bucket for preview clips
INSERT INTO storage.buckets (id, name, public) VALUES ('scenepack-previews', 'scenepack-previews', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "scenepack-previews public read" ON storage.objects;
CREATE POLICY "scenepack-previews public read" ON storage.objects FOR SELECT USING (bucket_id = 'scenepack-previews');
DROP POLICY IF EXISTS "scenepack-previews admin write" ON storage.objects;
CREATE POLICY "scenepack-previews admin write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'scenepack-previews' AND has_role(auth.uid(), 'admin'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.scenepack_pool;
