-- Add thumbnail_url to judge_rating_videos for cached/custom thumbnails
ALTER TABLE public.judge_rating_videos ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add thumbnail_url to event_participations for cached/custom thumbnails
ALTER TABLE public.event_participations ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add thumbnail_url to round_participations for cached/custom thumbnails
ALTER TABLE public.round_participations ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add thumbnail_url to sanctioned_tournament_participants for cached/custom thumbnails
ALTER TABLE public.sanctioned_tournament_participants ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;