
ALTER TABLE public.artist_campaigns ADD COLUMN IF NOT EXISTS goal_posts integer NOT NULL DEFAULT 0;
ALTER TABLE public.artist_campaigns ADD COLUMN IF NOT EXISTS client_name text;
