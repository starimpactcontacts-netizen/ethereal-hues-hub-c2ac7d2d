ALTER TABLE public.missions
ADD COLUMN IF NOT EXISTS eligible_platforms text[] NOT NULL DEFAULT ARRAY['tiktok','instagram','youtube']::text[];