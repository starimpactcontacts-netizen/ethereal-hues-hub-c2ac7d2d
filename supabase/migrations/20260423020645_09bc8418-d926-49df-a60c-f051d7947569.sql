ALTER TABLE public.editorium_indexed_edits
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS video_storage_path text,
  ADD COLUMN IF NOT EXISTS autoplay_with_sound boolean NOT NULL DEFAULT true;