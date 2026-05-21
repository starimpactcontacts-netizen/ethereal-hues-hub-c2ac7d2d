
ALTER TABLE public.radio_tracks
  ADD COLUMN IF NOT EXISTS preview_url TEXT,
  ADD COLUMN IF NOT EXISTS deezer_id BIGINT,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_radio_tracks_featured ON public.radio_tracks (is_featured, track_order);
CREATE UNIQUE INDEX IF NOT EXISTS uq_radio_tracks_deezer ON public.radio_tracks (deezer_id) WHERE deezer_id IS NOT NULL;
