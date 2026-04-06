-- Add mission_type to commissions for artist/brand/film categorization
ALTER TABLE public.commissions 
ADD COLUMN IF NOT EXISTS mission_type text NOT NULL DEFAULT 'standard';

-- Add client_name for brand/film missions
ALTER TABLE public.commissions 
ADD COLUMN IF NOT EXISTS client_name text;

-- Add reference video URL
ALTER TABLE public.commissions 
ADD COLUMN IF NOT EXISTS reference_video_url text;