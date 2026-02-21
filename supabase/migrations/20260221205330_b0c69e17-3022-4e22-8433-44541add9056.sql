-- Add judge video URL column to quick_fights for judge review videos
ALTER TABLE public.quick_fights ADD COLUMN IF NOT EXISTS judge_video_url text;
