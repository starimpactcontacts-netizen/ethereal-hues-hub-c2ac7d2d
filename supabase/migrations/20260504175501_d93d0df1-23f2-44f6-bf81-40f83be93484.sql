
-- 1) Add scenepack columns to quick_fights
ALTER TABLE public.quick_fights
  ADD COLUMN IF NOT EXISTS scenepack_option_a_id uuid,
  ADD COLUMN IF NOT EXISTS scenepack_option_b_id uuid,
  ADD COLUMN IF NOT EXISTS scenepack_vote_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS scenepack_vote_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS player_1_scenepack_vote uuid,
  ADD COLUMN IF NOT EXISTS player_2_scenepack_vote uuid,
  ADD COLUMN IF NOT EXISTS scenepack_locked_id uuid,
  ADD COLUMN IF NOT EXISTS scenepack_youtube_url text,
  ADD COLUMN IF NOT EXISTS scenepack_gdrive_url text;

-- 2) Lower default Edit Battle duration to 60 min (1 hour)
ALTER TABLE public.quick_fights ALTER COLUMN duration_minutes SET DEFAULT 60;

-- 3) Trigger: assign 30s vote when a quick_fight is created (already active)
CREATE OR REPLACE FUNCTION public.trg_assign_scenepack_quick_fight()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_pair record;
BEGIN
  IF NEW.scenepack_option_a_id IS NOT NULL THEN RETURN NEW; END IF;
  IF NEW.player_2_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.status NOT IN ('active','live','pending') THEN RETURN NEW; END IF;

  SELECT * INTO v_pair FROM public.pick_random_scenepack_pair();
  IF v_pair.a IS NOT NULL THEN
    NEW.scenepack_option_a_id := v_pair.a;
    NEW.scenepack_option_b_id := v_pair.b;
    NEW.scenepack_vote_started_at := now();
    NEW.scenepack_vote_deadline := now() + interval '30 seconds';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_scenepack_qf_ins ON public.quick_fights;
CREATE TRIGGER trg_assign_scenepack_qf_ins
  BEFORE INSERT ON public.quick_fights
  FOR EACH ROW EXECUTE FUNCTION public.trg_assign_scenepack_quick_fight();

-- 4) Resolve scenepack vote for a quick_fight
CREATE OR REPLACE FUNCTION public.resolve_scenepack_vote_quick_fight(p_fight_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_a uuid; v_b uuid; v_p1 uuid; v_p2 uuid; v_locked uuid; v_winner uuid;
  v_ct_a int := 0; v_ct_b int := 0;
  v_yt text; v_gd text;
BEGIN
  SELECT scenepack_option_a_id, scenepack_option_b_id, player_1_scenepack_vote, player_2_scenepack_vote, scenepack_locked_id
    INTO v_a, v_b, v_p1, v_p2, v_locked FROM public.quick_fights WHERE id = p_fight_id FOR UPDATE;

  IF v_locked IS NOT NULL THEN RETURN v_locked; END IF;
  IF v_a IS NULL OR v_b IS NULL THEN RETURN NULL; END IF;

  IF v_p1 = v_a THEN v_ct_a := v_ct_a + 1; ELSIF v_p1 = v_b THEN v_ct_b := v_ct_b + 1; END IF;
  IF v_p2 = v_a THEN v_ct_a := v_ct_a + 1; ELSIF v_p2 = v_b THEN v_ct_b := v_ct_b + 1; END IF;

  IF v_ct_a > v_ct_b THEN v_winner := v_a;
  ELSIF v_ct_b > v_ct_a THEN v_winner := v_b;
  ELSE v_winner := CASE WHEN random() < 0.5 THEN v_a ELSE v_b END;
  END IF;

  SELECT scenepack_youtube_url, scenepack_gdrive_url INTO v_yt, v_gd FROM public.scenepack_pool WHERE id = v_winner;

  UPDATE public.quick_fights
     SET scenepack_locked_id = v_winner,
         scenepack_youtube_url = COALESCE(scenepack_youtube_url, v_yt),
         scenepack_gdrive_url = COALESCE(scenepack_gdrive_url, v_gd)
   WHERE id = p_fight_id;

  RETURN v_winner;
END;
$$;

-- 5) Cast vote for quick_fight
CREATE OR REPLACE FUNCTION public.cast_scenepack_vote_quick_fight(p_fight_id uuid, p_scenepack_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_p1 uuid; v_p2 uuid; v_a uuid; v_b uuid;
  v_v1 uuid; v_v2 uuid; v_deadline timestamptz; v_locked uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;

  SELECT player_1_id, player_2_id, scenepack_option_a_id, scenepack_option_b_id,
         player_1_scenepack_vote, player_2_scenepack_vote, scenepack_vote_deadline, scenepack_locked_id
    INTO v_p1, v_p2, v_a, v_b, v_v1, v_v2, v_deadline, v_locked
    FROM public.quick_fights WHERE id = p_fight_id FOR UPDATE;

  IF v_locked IS NOT NULL THEN RETURN v_locked; END IF;
  IF p_scenepack_id NOT IN (v_a, v_b) THEN RAISE EXCEPTION 'invalid pick'; END IF;
  IF v_user NOT IN (v_p1, v_p2) THEN RAISE EXCEPTION 'not a participant'; END IF;

  IF v_user = v_p1 THEN
    v_v1 := p_scenepack_id;
    UPDATE public.quick_fights SET player_1_scenepack_vote = p_scenepack_id WHERE id = p_fight_id;
  ELSE
    v_v2 := p_scenepack_id;
    UPDATE public.quick_fights SET player_2_scenepack_vote = p_scenepack_id WHERE id = p_fight_id;
  END IF;

  IF v_v1 IS NOT NULL AND v_v2 IS NOT NULL THEN
    RETURN public.resolve_scenepack_vote_quick_fight(p_fight_id);
  END IF;
  IF v_deadline IS NOT NULL AND now() >= v_deadline THEN
    RETURN public.resolve_scenepack_vote_quick_fight(p_fight_id);
  END IF;
  RETURN NULL;
END;
$$;

-- 6) Resolve-if-expired helper
CREATE OR REPLACE FUNCTION public.resolve_scenepack_if_expired_quick_fight(p_fight_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_deadline timestamptz; v_locked uuid;
BEGIN
  SELECT scenepack_vote_deadline, scenepack_locked_id INTO v_deadline, v_locked FROM public.quick_fights WHERE id = p_fight_id;
  IF v_locked IS NOT NULL THEN RETURN v_locked; END IF;
  IF v_deadline IS NULL OR now() < v_deadline THEN RETURN NULL; END IF;
  RETURN public.resolve_scenepack_vote_quick_fight(p_fight_id);
END;
$$;

-- 7) Backfill any in-flight active Edit Battles missing a vote
DO $$
DECLARE r record; v_pair record;
BEGIN
  FOR r IN SELECT id FROM public.quick_fights
            WHERE status IN ('active','live','pending')
              AND scenepack_option_a_id IS NULL
              AND scenepack_locked_id IS NULL
              AND player_2_id IS NOT NULL
  LOOP
    SELECT * INTO v_pair FROM public.pick_random_scenepack_pair();
    IF v_pair.a IS NOT NULL THEN
      UPDATE public.quick_fights SET
        scenepack_option_a_id = v_pair.a,
        scenepack_option_b_id = v_pair.b,
        scenepack_vote_started_at = now(),
        scenepack_vote_deadline = now() + interval '30 seconds'
      WHERE id = r.id;
    END IF;
  END LOOP;
END $$;
