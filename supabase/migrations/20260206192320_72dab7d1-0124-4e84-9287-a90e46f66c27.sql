
-- Add custom_title to event_participations
ALTER TABLE public.event_participations ADD COLUMN IF NOT EXISTS custom_title text;

-- Add custom_title to round_participations
ALTER TABLE public.round_participations ADD COLUMN IF NOT EXISTS custom_title text;

-- Add custom_title to sanctioned_tournament_participants
ALTER TABLE public.sanctioned_tournament_participants ADD COLUMN IF NOT EXISTS custom_title text;

-- Add thumbnail_url to round_participations if not exists
ALTER TABLE public.round_participations ADD COLUMN IF NOT EXISTS thumbnail_url text;

-- Add thumbnail_url to sanctioned_tournament_participants if not exists
ALTER TABLE public.sanctioned_tournament_participants ADD COLUMN IF NOT EXISTS thumbnail_url text;
