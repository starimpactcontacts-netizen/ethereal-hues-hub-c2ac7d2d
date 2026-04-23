
ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS inspirations JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS scenepack_gdrive_url TEXT,
  ADD COLUMN IF NOT EXISTS scenepack_youtube_url TEXT;
