-- Add trial_judge to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'trial_judge';

-- Add judging experience field to judge_applications (for Discord comp experience etc)
ALTER TABLE public.judge_applications 
ADD COLUMN IF NOT EXISTS judging_experience TEXT,
ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Make video columns nullable since we're simplifying the application
ALTER TABLE public.judge_applications 
ALTER COLUMN video_url DROP NOT NULL,
ALTER COLUMN video_platform DROP NOT NULL;

-- Set defaults to null for test scores since test is being removed
COMMENT ON TABLE public.judge_applications IS 'Judge applications - simplified application flow without video test';