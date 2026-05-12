ALTER TABLE public.competition_submissions
ADD COLUMN IF NOT EXISTS clip_start numeric NOT NULL DEFAULT 0;