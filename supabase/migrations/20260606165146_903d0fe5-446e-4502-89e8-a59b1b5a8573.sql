
ALTER TABLE public.solo_shares
  ADD COLUMN IF NOT EXISTS timer_minutes integer,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS deadline_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_overtime boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS start_offset_seconds integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS song_name text,
  ADD COLUMN IF NOT EXISTS scenepack_url text;
