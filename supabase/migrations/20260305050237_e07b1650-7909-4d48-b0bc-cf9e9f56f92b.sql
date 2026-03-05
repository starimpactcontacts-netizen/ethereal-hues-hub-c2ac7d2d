
ALTER TABLE public.featured_drops 
  ADD COLUMN IF NOT EXISTS instant_payout boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS inspo_url text,
  ADD COLUMN IF NOT EXISTS inspo_thumbnail_url text,
  ADD COLUMN IF NOT EXISTS theme_description text;
