-- ─────────────────────────────────────────────────────────────────────────────
-- Sync Edit Battle mode
-- Both editors receive the same randomly-drawn scenepack + song via a gacha
-- spin, making the battle purely about who makes the better edit.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. battle_mode column on quick_fights
ALTER TABLE public.quick_fights
  ADD COLUMN IF NOT EXISTS battle_mode TEXT NOT NULL DEFAULT 'standard'
  CHECK (battle_mode IN ('standard', 'sync'));

-- 2. Sync result columns (populated atomically by spin_sync_fight RPC)
ALTER TABLE public.quick_fights
  ADD COLUMN IF NOT EXISTS sync_scenepack_id UUID,
  ADD COLUMN IF NOT EXISTS sync_scenepack_name TEXT,
  ADD COLUMN IF NOT EXISTS sync_scenepack_preview_url TEXT,
  ADD COLUMN IF NOT EXISTS sync_song_title TEXT,
  ADD COLUMN IF NOT EXISTS sync_song_artist TEXT,
  ADD COLUMN IF NOT EXISTS sync_song_preview_url TEXT,
  ADD COLUMN IF NOT EXISTS sync_spun_at TIMESTAMPTZ;

-- 3. Curated song pool for the sync spin wheel
CREATE TABLE public.sync_song_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  preview_url TEXT,
  cover_url TEXT,
  genre TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sync_song_pool ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active sync songs" ON public.sync_song_pool
  FOR SELECT USING (active = true);

CREATE POLICY "Admins manage sync songs" ON public.sync_song_pool
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'dev'))
  );

-- 4. Seed battle-ready songs
INSERT INTO public.sync_song_pool (title, artist, genre, sort_order) VALUES
  ('HUMBLE.', 'Kendrick Lamar', 'Hip Hop', 1),
  ('DNA.', 'Kendrick Lamar', 'Hip Hop', 2),
  ('ROYAL', 'Kendrick Lamar ft. Future', 'Hip Hop', 3),
  ('SICKO MODE', 'Travis Scott', 'Trap', 4),
  ('MELTDOWN', 'Travis Scott ft. Drake', 'Trap', 5),
  ('BUTTERFLY EFFECT', 'Travis Scott', 'Trap', 6),
  ('God''s Plan', 'Drake', 'Hip Hop', 7),
  ('Blinding Lights', 'The Weeknd', 'Pop', 8),
  ('Starboy', 'The Weeknd ft. Daft Punk', 'Pop', 9),
  ('Die For You', 'The Weeknd', 'R&B', 10),
  ('MONTERO (Call Me By Your Name)', 'Lil Nas X', 'Pop', 11),
  ('INDUSTRY BABY', 'Lil Nas X ft. Jack Harlow', 'Hip Hop', 12),
  ('Panda', 'Desiigner', 'Trap', 13),
  ('XO TOUR Llif3', 'Lil Uzi Vert', 'Trap', 14),
  ('Bad Guy', 'Billie Eilish', 'Pop', 15),
  ('Runaway', 'Kanye West ft. Pusha T', 'Hip Hop', 16),
  ('POWER', 'Kanye West', 'Hip Hop', 17),
  ('Ghost Town', 'Kanye West', 'Pop', 18),
  ('Levitating', 'Dua Lipa', 'Pop', 19),
  ('Savage', 'Megan Thee Stallion ft. Beyoncé', 'Hip Hop', 20),
  ('LUST.', 'Kendrick Lamar', 'Hip Hop', 21),
  ('Neon Guts', 'Lil Uzi Vert ft. Pharrell', 'Trap', 22),
  ('SKELETONS', 'Travis Scott', 'Psychedelic Trap', 23),
  ('The Hills', 'The Weeknd', 'Dark R&B', 24),
  ('Call Out My Name', 'The Weeknd', 'R&B', 25);

-- 5. spin_sync_fight RPC
-- Called by either participant; idempotent (returns existing result if already spun).
-- Picks a random scenepack + song, locks them in, and transitions fight to active.
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

  -- Idempotent: already spun → return existing result
  IF v_fight.sync_spun_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'scenepack_name',        v_fight.sync_scenepack_name,
      'scenepack_preview_url', v_fight.sync_scenepack_preview_url,
      'song_title',            v_fight.sync_song_title,
      'song_artist',           v_fight.sync_song_artist
    );
  END IF;

  -- Random scenepack from pool
  SELECT * INTO v_scenepack FROM scenepack_pool WHERE active = true ORDER BY RANDOM() LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'No scenepacks in pool'; END IF;

  -- Random song from pool
  SELECT * INTO v_song FROM sync_song_pool WHERE active = true ORDER BY RANDOM() LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'No songs in pool'; END IF;

  -- Duration label for system message
  v_dur_mins := COALESCE(v_fight.duration_minutes, 60);
  v_dur_label := CASE
    WHEN v_dur_mins >= 60 AND v_dur_mins % 60 = 0
      THEN (v_dur_mins / 60)::text || ' hour' || CASE WHEN v_dur_mins / 60 = 1 THEN '' ELSE 's' END
    ELSE v_dur_mins::text || ' minutes'
  END;

  -- Lock selection + transition to active
  UPDATE quick_fights SET
    sync_scenepack_id          = v_scenepack.id,
    sync_scenepack_name        = v_scenepack.title,
    sync_scenepack_preview_url = v_scenepack.preview_video_url,
    sync_song_title            = v_song.title,
    sync_song_artist           = v_song.artist,
    sync_song_preview_url      = v_song.preview_url,
    sync_spun_at               = v_starts,
    player_1_selection_ready   = true,
    player_2_selection_ready   = true,
    status                     = 'active',
    matched_at                 = COALESCE(matched_at, v_starts),
    starts_at                  = v_starts,
    ends_at                    = v_starts + make_interval(mins => v_dur_mins),
    updated_at                 = now()
  WHERE id = p_fight_id;

  -- System chat message
  INSERT INTO quick_fight_messages (fight_id, user_id, username, message_text, is_system)
  VALUES (
    p_fight_id,
    '00000000-0000-0000-0000-000000000000',
    'System',
    '🎲 SYNC BATTLE — Scenepack: ' || v_scenepack.title || ' · Song: ' || v_song.title || ' by ' || v_song.artist || '. You have ' || v_dur_label || ' to submit.',
    true
  );

  RETURN jsonb_build_object(
    'scenepack_name',        v_scenepack.title,
    'scenepack_preview_url', v_scenepack.preview_video_url,
    'song_title',            v_song.title,
    'song_artist',           v_song.artist
  );
END;
$$;
