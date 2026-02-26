
-- Add permanent metadata columns to featured_submissions
ALTER TABLE public.featured_submissions
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS video_title text,
  ADD COLUMN IF NOT EXISTS author_username text,
  ADD COLUMN IF NOT EXISTS embed_html text;

-- Add permanent metadata columns to judge_rating_videos
ALTER TABLE public.judge_rating_videos
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS author_username text,
  ADD COLUMN IF NOT EXISTS embed_html text;

-- Add video_title and author_username to round_participations (already has thumbnail_url, custom_title)
ALTER TABLE public.round_participations
  ADD COLUMN IF NOT EXISTS author_username text,
  ADD COLUMN IF NOT EXISTS embed_html text;

-- Add video_title and author_username to event_participations (already has thumbnail_url, custom_title)
ALTER TABLE public.event_participations
  ADD COLUMN IF NOT EXISTS author_username text,
  ADD COLUMN IF NOT EXISTS embed_html text;

-- Add video_title to battles (already has challenger/opponent_thumbnail_url)
ALTER TABLE public.battles
  ADD COLUMN IF NOT EXISTS challenger_video_title text,
  ADD COLUMN IF NOT EXISTS challenger_author_username text,
  ADD COLUMN IF NOT EXISTS opponent_video_title text,
  ADD COLUMN IF NOT EXISTS opponent_author_username text;
