ALTER TABLE public.quick_fights DROP CONSTRAINT IF EXISTS quick_fights_status_check;
ALTER TABLE public.quick_fights ADD CONSTRAINT quick_fights_status_check
CHECK (status IN ('waiting', 'selecting', 'active', 'submitted', 'judging', 'completed', 'forfeited', 'cancelled'));

ALTER TABLE public.quick_fights
  ADD COLUMN IF NOT EXISTS selection_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS selection_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS player_1_selection_ready boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS player_2_selection_ready boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.quick_fight_selections (
  fight_id uuid NOT NULL REFERENCES public.quick_fights(id) ON DELETE CASCADE,
  player_id uuid NOT NULL,
  side text NOT NULL CHECK (side IN ('red', 'blue')),
  scenepack_id text,
  scenepack_name text,
  scenepack_poster text,
  scenepack_count integer,
  song_id text,
  song_title text,
  song_artist text,
  song_cover text,
  song_preview text,
  ready boolean NOT NULL DEFAULT false,
  ready_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (fight_id, player_id)
);

ALTER TABLE public.quick_fight_selections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Players can view their own quick fight selections" ON public.quick_fight_selections;
CREATE POLICY "Players can view their own quick fight selections"
ON public.quick_fight_selections
FOR SELECT
TO authenticated
USING (auth.uid() = player_id OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Players can create their own quick fight selections" ON public.quick_fight_selections;
CREATE POLICY "Players can create their own quick fight selections"
ON public.quick_fight_selections
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = player_id
  AND EXISTS (
    SELECT 1 FROM public.quick_fights qf
    WHERE qf.id = fight_id
      AND auth.uid() IN (qf.player_1_id, qf.player_2_id)
  )
);

DROP POLICY IF EXISTS "Players can update their own quick fight selections" ON public.quick_fight_selections;
CREATE POLICY "Players can update their own quick fight selections"
ON public.quick_fight_selections
FOR UPDATE
TO authenticated
USING (auth.uid() = player_id)
WITH CHECK (auth.uid() = player_id);

CREATE INDEX IF NOT EXISTS idx_quick_fight_selections_fight ON public.quick_fight_selections(fight_id);

CREATE OR REPLACE FUNCTION public.touch_quick_fight_selection_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_quick_fight_selection_updated_at ON public.quick_fight_selections;
CREATE TRIGGER trg_touch_quick_fight_selection_updated_at
BEFORE UPDATE ON public.quick_fight_selections
FOR EACH ROW
EXECUTE FUNCTION public.touch_quick_fight_selection_updated_at();

CREATE OR REPLACE FUNCTION public.get_quick_fight_selection_state(p_fight_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fight record;
  v_user uuid := auth.uid();
  v_side text;
  my_sel record;
  opp_sel record;
  reveal boolean;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO fight FROM public.quick_fights WHERE id = p_fight_id;
  IF fight IS NULL THEN RAISE EXCEPTION 'Fight not found'; END IF;

  IF v_user = fight.player_1_id THEN
    v_side := 'red';
  ELSIF v_user = fight.player_2_id THEN
    v_side := 'blue';
  ELSE
    RAISE EXCEPTION 'Not a participant';
  END IF;

  SELECT * INTO my_sel FROM public.quick_fight_selections WHERE fight_id = p_fight_id AND player_id = v_user;
  SELECT * INTO opp_sel FROM public.quick_fight_selections WHERE fight_id = p_fight_id AND player_id <> v_user LIMIT 1;

  reveal := fight.status <> 'selecting'
    OR (COALESCE(fight.player_1_selection_ready, false) AND COALESCE(fight.player_2_selection_ready, false))
    OR (fight.selection_deadline IS NOT NULL AND fight.selection_deadline <= now());

  RETURN jsonb_build_object(
    'status', fight.status,
    'selectionStartedAt', fight.selection_started_at,
    'selectionDeadline', fight.selection_deadline,
    'mySide', v_side,
    'myReady', COALESCE(my_sel.ready, false),
    'opponentReady', CASE WHEN v_side = 'red' THEN COALESCE(fight.player_2_selection_ready, false) ELSE COALESCE(fight.player_1_selection_ready, false) END,
    'bothReady', COALESCE(fight.player_1_selection_ready, false) AND COALESCE(fight.player_2_selection_ready, false),
    'reveal', reveal,
    'mine', CASE WHEN my_sel IS NULL THEN NULL ELSE jsonb_build_object(
      'pack', jsonb_build_object('id', my_sel.scenepack_id, 'name', my_sel.scenepack_name, 'poster', my_sel.scenepack_poster, 'packCount', my_sel.scenepack_count),
      'song', jsonb_build_object('id', my_sel.song_id, 'title', my_sel.song_title, 'artist', my_sel.song_artist, 'cover', my_sel.song_cover, 'preview', my_sel.song_preview),
      'ready', my_sel.ready
    ) END,
    'opponent', CASE WHEN reveal AND opp_sel IS NOT NULL THEN jsonb_build_object(
      'pack', jsonb_build_object('id', opp_sel.scenepack_id, 'name', opp_sel.scenepack_name, 'poster', opp_sel.scenepack_poster, 'packCount', opp_sel.scenepack_count),
      'song', jsonb_build_object('id', opp_sel.song_id, 'title', opp_sel.song_title, 'artist', opp_sel.song_artist, 'cover', opp_sel.song_cover, 'preview', opp_sel.song_preview),
      'ready', opp_sel.ready
    ) ELSE NULL END
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_quick_fight_selection(
  p_fight_id uuid,
  p_scenepack jsonb DEFAULT NULL,
  p_song jsonb DEFAULT NULL,
  p_ready boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fight record;
  v_user uuid := auth.uid();
  v_side text;
  already_ready boolean;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authorized'; END IF;

  SELECT * INTO fight FROM public.quick_fights WHERE id = p_fight_id FOR UPDATE;
  IF fight IS NULL THEN RAISE EXCEPTION 'Fight not found'; END IF;

  IF v_user = fight.player_1_id THEN
    v_side := 'red';
  ELSIF v_user = fight.player_2_id THEN
    v_side := 'blue';
  ELSE
    RAISE EXCEPTION 'Not a participant';
  END IF;

  IF fight.status <> 'selecting' THEN RAISE EXCEPTION 'Selection is not open'; END IF;
  IF p_ready AND (p_scenepack IS NULL OR p_song IS NULL) THEN RAISE EXCEPTION 'Pick scenepack and song first'; END IF;

  SELECT COALESCE(ready, false) INTO already_ready FROM public.quick_fight_selections WHERE fight_id = p_fight_id AND player_id = v_user;
  IF COALESCE(already_ready, false) THEN
    RETURN public.get_quick_fight_selection_state(p_fight_id);
  END IF;

  INSERT INTO public.quick_fight_selections (
    fight_id, player_id, side,
    scenepack_id, scenepack_name, scenepack_poster, scenepack_count,
    song_id, song_title, song_artist, song_cover, song_preview,
    ready, ready_at
  ) VALUES (
    p_fight_id, v_user, v_side,
    p_scenepack->>'id', p_scenepack->>'name', p_scenepack->>'poster', NULLIF(p_scenepack->>'packCount', '')::integer,
    p_song->>'id', p_song->>'title', p_song->>'artist', p_song->>'cover', p_song->>'preview',
    p_ready, CASE WHEN p_ready THEN now() ELSE NULL END
  )
  ON CONFLICT (fight_id, player_id) DO UPDATE SET
    scenepack_id = EXCLUDED.scenepack_id,
    scenepack_name = EXCLUDED.scenepack_name,
    scenepack_poster = EXCLUDED.scenepack_poster,
    scenepack_count = EXCLUDED.scenepack_count,
    song_id = EXCLUDED.song_id,
    song_title = EXCLUDED.song_title,
    song_artist = EXCLUDED.song_artist,
    song_cover = EXCLUDED.song_cover,
    song_preview = EXCLUDED.song_preview,
    ready = EXCLUDED.ready,
    ready_at = CASE WHEN EXCLUDED.ready THEN now() ELSE NULL END;

  IF v_side = 'red' THEN
    UPDATE public.quick_fights SET player_1_selection_ready = player_1_selection_ready OR p_ready, updated_at = now() WHERE id = p_fight_id;
  ELSE
    UPDATE public.quick_fights SET player_2_selection_ready = player_2_selection_ready OR p_ready, updated_at = now() WHERE id = p_fight_id;
  END IF;

  RETURN public.get_quick_fight_selection_state(p_fight_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.start_quick_fight_from_selection(p_fight_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fight record;
  starts timestamptz := now();
  duration_mins int;
  duration_label text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authorized'; END IF;

  SELECT * INTO fight FROM public.quick_fights WHERE id = p_fight_id FOR UPDATE;
  IF fight IS NULL THEN RETURN false; END IF;
  IF auth.uid() NOT IN (fight.player_1_id, fight.player_2_id) THEN RAISE EXCEPTION 'Not a participant'; END IF;
  IF fight.status = 'active' THEN RETURN true; END IF;
  IF fight.status <> 'selecting' THEN RETURN false; END IF;

  IF NOT ((COALESCE(fight.player_1_selection_ready, false) AND COALESCE(fight.player_2_selection_ready, false)) OR (fight.selection_deadline IS NOT NULL AND fight.selection_deadline <= now())) THEN
    RETURN false;
  END IF;

  duration_mins := COALESCE(fight.duration_minutes, 60);
  duration_label := CASE
    WHEN duration_mins >= 60 AND duration_mins % 60 = 0 THEN (duration_mins / 60)::text || ' hour' || CASE WHEN duration_mins / 60 = 1 THEN '' ELSE 's' END
    ELSE duration_mins::text || ' minutes'
  END;

  UPDATE public.quick_fights
  SET status = 'active',
      matched_at = COALESCE(matched_at, starts),
      starts_at = starts,
      ends_at = starts + make_interval(mins => duration_mins),
      player_1_selection_ready = true,
      player_2_selection_ready = true,
      updated_at = now()
  WHERE id = p_fight_id;

  INSERT INTO public.quick_fight_messages (fight_id, user_id, username, message_text, is_system)
  VALUES (p_fight_id, '00000000-0000-0000-0000-000000000000'::uuid, 'System', '⚔️ FIGHT STARTED! You have ' || duration_label || ' to submit your edit.', true);

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.quick_fight_match(p_user_id uuid, p_username text, p_avatar_url text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  matched RECORD;
  new_fight_id UUID;
  starts TIMESTAMPTZ := now();
BEGIN
  DELETE FROM public.quick_fight_queue WHERE expires_at < now();

  SELECT * INTO matched
  FROM public.quick_fight_queue
  WHERE user_id != p_user_id
    AND expires_at > now()
  ORDER BY queued_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF matched IS NULL THEN
    INSERT INTO public.quick_fight_queue (user_id, username, avatar_url)
    VALUES (p_user_id, p_username, p_avatar_url)
    ON CONFLICT (user_id) DO UPDATE
    SET username = p_username, avatar_url = p_avatar_url, queued_at = now(), expires_at = now() + INTERVAL '5 minutes';
    RETURN NULL;
  END IF;

  INSERT INTO public.quick_fights (
    player_1_id, player_1_username, player_1_avatar_url,
    player_2_id, player_2_username, player_2_avatar_url,
    status, matched_at, duration_minutes, selection_started_at, selection_deadline
  ) VALUES (
    matched.user_id, matched.username, matched.avatar_url,
    p_user_id, p_username, p_avatar_url,
    'selecting', starts, 60, starts, starts + INTERVAL '3 minutes'
  )
  RETURNING id INTO new_fight_id;

  DELETE FROM public.quick_fight_queue WHERE user_id IN (p_user_id, matched.user_id);

  INSERT INTO public.quick_fight_messages (fight_id, user_id, username, message_text, is_system)
  VALUES (new_fight_id, '00000000-0000-0000-0000-000000000000'::uuid, 'System', '🎬 Selection lobby opened. Both editors have 3 minutes to pick scenepack + song.', true);

  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES
    (matched.user_id, 'quick_fight', '⚔️ Match Found!', 'Pick your scenepack and song vs @' || p_username || '.', jsonb_build_object('fight_id', new_fight_id)),
    (p_user_id, 'quick_fight', '⚔️ Match Found!', 'Pick your scenepack and song vs @' || matched.username || '.', jsonb_build_object('fight_id', new_fight_id));

  RETURN new_fight_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.join_waiting_quick_fight(
  p_fight_id uuid,
  p_user_id uuid,
  p_username text,
  p_avatar_url text DEFAULT NULL::text,
  p_join_code text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  fight RECORD;
  starts timestamptz := now();
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN RAISE EXCEPTION 'Not authorized'; END IF;

  SELECT * INTO fight FROM public.quick_fights WHERE id = p_fight_id FOR UPDATE;
  IF fight IS NULL THEN RAISE EXCEPTION 'Lobby not found'; END IF;
  IF fight.status <> 'waiting' OR fight.player_2_id IS NOT NULL THEN RAISE EXCEPTION 'Lobby is no longer open'; END IF;
  IF fight.player_1_id = p_user_id THEN RAISE EXCEPTION 'Owner cannot join their own lobby'; END IF;

  IF fight.is_private THEN
    IF p_join_code IS NULL OR upper(trim(p_join_code)) <> fight.join_code THEN RAISE EXCEPTION 'Invalid join code'; END IF;
  END IF;

  DELETE FROM public.quick_fight_queue WHERE user_id = p_user_id;

  UPDATE public.quick_fights
  SET player_2_id = p_user_id,
      player_2_username = p_username,
      player_2_avatar_url = p_avatar_url,
      status = 'selecting',
      matched_at = starts,
      selection_started_at = starts,
      selection_deadline = starts + INTERVAL '3 minutes',
      player_1_selection_ready = false,
      player_2_selection_ready = false,
      updated_at = now()
  WHERE id = p_fight_id;

  INSERT INTO public.quick_fight_messages (fight_id, user_id, username, message_text, is_system)
  VALUES (p_fight_id, '00000000-0000-0000-0000-000000000000'::uuid, 'System', '🎬 Selection lobby opened. Both editors have 3 minutes to pick scenepack + song.', true);

  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES
    (fight.player_1_id, 'quick_fight', '⚔️ Battle Accepted!', '@' || p_username || ' joined. Pick your scenepack and song.', jsonb_build_object('fight_id', p_fight_id)),
    (p_user_id, 'quick_fight', '⚔️ Selection Lobby!', 'Pick your scenepack and song vs @' || fight.player_1_username || '.', jsonb_build_object('fight_id', p_fight_id));

  RETURN p_fight_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.resolve_expired_quick_fights()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  fight RECORD;
  resolved_count INTEGER := 0;
  p1_submitted BOOLEAN;
  p2_submitted BOOLEAN;
BEGIN
  FOR fight IN
    SELECT * FROM public.quick_fights
    WHERE status = 'selecting'
      AND selection_deadline IS NOT NULL
      AND selection_deadline <= now()
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE public.quick_fights
    SET status = 'active',
        starts_at = now(),
        ends_at = now() + make_interval(mins => COALESCE(duration_minutes, 60)),
        player_1_selection_ready = true,
        player_2_selection_ready = true,
        updated_at = now()
    WHERE id = fight.id;
    INSERT INTO public.quick_fight_messages (fight_id, user_id, username, message_text, is_system)
    VALUES (fight.id, '00000000-0000-0000-0000-000000000000'::uuid, 'System', '⚔️ Selection timer expired. Fight started.', true);
    resolved_count := resolved_count + 1;
  END LOOP;

  FOR fight IN
    SELECT * FROM public.quick_fights
    WHERE status = 'active'
      AND ends_at IS NOT NULL
      AND ends_at < now()
    FOR UPDATE SKIP LOCKED
  LOOP
    p1_submitted := fight.player_1_submitted_at IS NOT NULL;
    p2_submitted := fight.player_2_submitted_at IS NOT NULL;

    IF NOT p1_submitted AND NOT p2_submitted THEN
      UPDATE public.quick_fights SET status = 'cancelled', updated_at = now() WHERE id = fight.id;
      INSERT INTO public.notifications (user_id, type, title, message, data) VALUES
        (fight.player_1_id, 'quick_fight_result', '⚔️ Fight Cancelled', 'Neither player submitted. No index awarded.', jsonb_build_object('fight_id', fight.id)),
        (fight.player_2_id, 'quick_fight_result', '⚔️ Fight Cancelled', 'Neither player submitted. No index awarded.', jsonb_build_object('fight_id', fight.id));
    ELSIF p1_submitted AND NOT p2_submitted THEN
      UPDATE public.quick_fights
      SET status = 'completed', winner_id = fight.player_1_id, winner_score = 100, loser_score = 0,
          judge_notes = 'Won by forfeit — opponent did not submit', judged_at = now(), updated_at = now()
      WHERE id = fight.id;
      UPDATE public.profiles SET spendable_index = spendable_index + 20, global_index_score = COALESCE(global_index_score, 0) + 20 WHERE id = fight.player_1_id;
      UPDATE public.profiles SET spendable_index = GREATEST(spendable_index - 10, 0), global_index_score = GREATEST(COALESCE(global_index_score, 0) - 10, 0) WHERE id = fight.player_2_id;
    ELSIF NOT p1_submitted AND p2_submitted THEN
      UPDATE public.quick_fights
      SET status = 'completed', winner_id = fight.player_2_id, winner_score = 100, loser_score = 0,
          judge_notes = 'Won by forfeit — opponent did not submit', judged_at = now(), updated_at = now()
      WHERE id = fight.id;
      UPDATE public.profiles SET spendable_index = spendable_index + 20, global_index_score = COALESCE(global_index_score, 0) + 20 WHERE id = fight.player_2_id;
      UPDATE public.profiles SET spendable_index = GREATEST(spendable_index - 10, 0), global_index_score = GREATEST(COALESCE(global_index_score, 0) - 10, 0) WHERE id = fight.player_1_id;
    END IF;

    resolved_count := resolved_count + 1;
  END LOOP;

  RETURN resolved_count;
END;
$$;