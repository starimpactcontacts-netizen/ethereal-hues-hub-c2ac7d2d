
-- Add view_count to submission tables (manually updatable, only field that changes after initial submission)
ALTER TABLE public.round_participations ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;
ALTER TABLE public.event_participations ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;
ALTER TABLE public.featured_submissions ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;
ALTER TABLE public.judge_rating_videos ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;
