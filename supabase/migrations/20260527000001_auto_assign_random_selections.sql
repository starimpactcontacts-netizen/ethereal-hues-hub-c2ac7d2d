-- When the selection deadline expires, auto-assign a random scenepack + song to
-- any player who has not yet made a complete selection, then start the fight.
-- This replaces the previous version that just flipped status without filling picks.

CREATE OR REPLACE FUNCTION public.resolve_expired_quick_fights()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  fight         RECORD;
  resolved_count INTEGER := 0;
  p1_submitted  BOOLEAN;
  p2_submitted  BOOLEAN;
  rand_pack     RECORD;
  rand_song     RECORD;
  sel           RECORD;
  v_player      uuid;
  v_side        text;
BEGIN
  -- ── 1. Expired selection lobbies → auto-assign missing picks then activate ──
  FOR fight IN
    SELECT * FROM public.quick_fights
    WHERE status = 'selecting'
      AND selection_deadline IS NOT NULL
      AND selection_deadline <= now()
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Pick one random scenepack and one random song once per fight (reuse for both if needed)
    SELECT id, title, thumbnail_url, pack_count
      INTO rand_pack
      FROM public.scenepack_pool
      WHERE active = true
      ORDER BY random()
      LIMIT 1;

    SELECT id, song_name, artist_name, cover_url, preview_url, audio_url
      INTO rand_song
      FROM public.battle_songs
      WHERE is_featured = true
      ORDER BY random()
      LIMIT 1;

    -- Fill missing selections for both players
    FOR v_player, v_side IN
      VALUES (fight.player_1_id, 'red'), (fight.player_2_id, 'blue')
    LOOP
      SELECT * INTO sel
        FROM public.quick_fight_selections
        WHERE fight_id = fight.id AND player_id = v_player;

      IF sel IS NULL THEN
        -- Player never opened the selection screen — insert full random row
        INSERT INTO public.quick_fight_selections (
          fight_id, player_id, side,
          scenepack_id, scenepack_name, scenepack_poster, scenepack_count,
          song_id, song_title, song_artist, song_cover, song_preview,
          ready, ready_at
        ) VALUES (
          fight.id, v_player, v_side,
          rand_pack.id::text,
          COALESCE(rand_pack.title, 'Random Pack'),
          COALESCE(rand_pack.thumbnail_url, ''),
          COALESCE(rand_pack.pack_count, 0),
          rand_song.id::text,
          COALESCE(rand_song.song_name, 'Random Song'),
          COALESCE(rand_song.artist_name, ''),
          rand_song.cover_url,
          COALESCE(rand_song.preview_url, rand_song.audio_url),
          true, now()
        )
        ON CONFLICT (fight_id, player_id) DO NOTHING;

      ELSE
        -- Player was on the screen but didn't fully pick — fill only what's missing
        UPDATE public.quick_fight_selections
        SET
          scenepack_id     = COALESCE(sel.scenepack_id,   rand_pack.id::text),
          scenepack_name   = COALESCE(sel.scenepack_name, rand_pack.title, 'Random Pack'),
          scenepack_poster = COALESCE(sel.scenepack_poster, rand_pack.thumbnail_url, ''),
          scenepack_count  = COALESCE(sel.scenepack_count, rand_pack.pack_count, 0),
          song_id          = COALESCE(sel.song_id,   rand_song.id::text),
          song_title       = COALESCE(sel.song_title, rand_song.song_name, 'Random Song'),
          song_artist      = COALESCE(sel.song_artist, rand_song.artist_name, ''),
          song_cover       = COALESCE(sel.song_cover, rand_song.cover_url),
          song_preview     = COALESCE(sel.song_preview, rand_song.preview_url, rand_song.audio_url),
          ready            = true,
          ready_at         = COALESCE(sel.ready_at, now())
        WHERE fight_id = fight.id AND player_id = v_player;
      END IF;
    END LOOP;

    -- Activate the fight
    UPDATE public.quick_fights
    SET status = 'active',
        starts_at = now(),
        ends_at = now() + make_interval(mins => COALESCE(duration_minutes, 60)),
        player_1_selection_ready = true,
        player_2_selection_ready = true,
        updated_at = now()
    WHERE id = fight.id;

    INSERT INTO public.quick_fight_messages (fight_id, user_id, username, message_text, is_system)
    VALUES (
      fight.id,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'System',
      '🎲 Selection timer expired — random picks assigned. Fight started!',
      true
    );

    resolved_count := resolved_count + 1;
  END LOOP;

  -- ── 2. Expired active fights → forfeit / cancel (unchanged logic) ──
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
    ELSE
      UPDATE public.quick_fights SET status = 'judging', updated_at = now() WHERE id = fight.id;
      INSERT INTO public.notifications (user_id, type, title, message, data) VALUES
        (fight.player_1_id, 'quick_fight_result', '⚖️ Fight in Judging', 'Both edits are in — a judge will decide the winner.', jsonb_build_object('fight_id', fight.id)),
        (fight.player_2_id, 'quick_fight_result', '⚖️ Fight in Judging', 'Both edits are in — a judge will decide the winner.', jsonb_build_object('fight_id', fight.id));
    END IF;
  END LOOP;

  RETURN resolved_count;
END;
$$;
