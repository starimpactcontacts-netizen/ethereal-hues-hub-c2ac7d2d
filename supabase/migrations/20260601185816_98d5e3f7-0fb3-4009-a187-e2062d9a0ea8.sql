ALTER TABLE public.quick_fights
  ADD COLUMN IF NOT EXISTS sync_scenepack_thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS sync_song_cover_url TEXT,
  ADD COLUMN IF NOT EXISTS sync_song_difficulty TEXT;

CREATE OR REPLACE FUNCTION public.spin_sync_fight(p_fight_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fight      RECORD;
  v_scenepack  RECORD;
  v_song       RECORD;
  v_starts     TIMESTAMPTZ := now();
  v_dur_mins   INT;
  v_dur_label  TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authorized'; END IF;

  SELECT * INTO v_fight FROM quick_fights WHERE id = p_fight_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Fight not found'; END IF;
  IF auth.uid() NOT IN (v_fight.player_1_id, v_fight.player_2_id) THEN
    RAISE EXCEPTION 'Not a participant';
  END IF;
  IF v_fight.battle_mode != 'sync' THEN
    RAISE EXCEPTION 'Not a sync battle';
  END IF;

  IF v_fight.sync_spun_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'scenepack_name',          v_fight.sync_scenepack_name,
      'scenepack_thumbnail_url', v_fight.sync_scenepack_thumbnail_url,
      'song_title',              v_fight.sync_song_title,
      'song_artist',             v_fight.sync_song_artist,
      'song_cover_url',          v_fight.sync_song_cover_url,
      'song_difficulty',         v_fight.sync_song_difficulty
    );
  END IF;

  SELECT * INTO v_scenepack FROM scenepack_pool WHERE active = true ORDER BY RANDOM() LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'No scenepacks in pool'; END IF;

  SELECT * INTO v_song FROM battle_songs WHERE deezer_id IS NULL ORDER BY RANDOM() LIMIT 1;
  IF NOT FOUND THEN
    SELECT * INTO v_song FROM battle_songs ORDER BY RANDOM() LIMIT 1;
  END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'No songs in pool'; END IF;

  v_dur_mins := COALESCE(v_fight.duration_minutes, 60);
  v_dur_label := CASE
    WHEN v_dur_mins >= 60 AND v_dur_mins % 60 = 0
      THEN (v_dur_mins / 60)::text || ' hour' || CASE WHEN v_dur_mins / 60 = 1 THEN '' ELSE 's' END
    ELSE v_dur_mins::text || ' minutes'
  END;

  UPDATE quick_fights SET
    sync_scenepack_id            = v_scenepack.id,
    sync_scenepack_name          = v_scenepack.title,
    sync_scenepack_preview_url   = v_scenepack.preview_video_url,
    sync_scenepack_thumbnail_url = v_scenepack.thumbnail_url,
    sync_song_title              = v_song.song_name,
    sync_song_artist             = v_song.artist_name,
    sync_song_preview_url        = v_song.preview_url,
    sync_song_cover_url          = v_song.cover_url,
    sync_song_difficulty         = v_song.difficulty,
    sync_spun_at                 = v_starts,
    player_1_selection_ready     = true,
    player_2_selection_ready     = true,
    status                       = 'active',
    matched_at                   = COALESCE(matched_at, v_starts),
    starts_at                    = v_starts,
    ends_at                      = v_starts + make_interval(mins => v_dur_mins),
    updated_at                   = now()
  WHERE id = p_fight_id;

  INSERT INTO quick_fight_messages (fight_id, user_id, username, message_text, is_system)
  VALUES (
    p_fight_id,
    '00000000-0000-0000-0000-000000000000',
    'System',
    '🎲 SYNC BATTLE — Scenepack: ' || v_scenepack.title || ' · Song: ' || v_song.song_name || ' by ' || COALESCE(v_song.artist_name, '???') || '. You have ' || v_dur_label || ' to submit.',
    true
  );

  RETURN jsonb_build_object(
    'scenepack_name',          v_scenepack.title,
    'scenepack_thumbnail_url', v_scenepack.thumbnail_url,
    'song_title',              v_song.song_name,
    'song_artist',             v_song.artist_name,
    'song_cover_url',          v_song.cover_url,
    'song_difficulty',         v_song.difficulty
  );
END;
$$;