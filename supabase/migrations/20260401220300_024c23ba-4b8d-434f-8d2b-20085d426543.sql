ALTER TABLE public.artist_campaigns 
ADD COLUMN IF NOT EXISTS campaign_type text NOT NULL DEFAULT 'artist',
ADD COLUMN IF NOT EXISTS logo_url text;
