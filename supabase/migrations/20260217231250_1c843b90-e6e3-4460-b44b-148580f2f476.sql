
-- Add slug to events for clean URLs
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Auto-generate slugs for existing events
UPDATE public.events SET slug = lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) || '-' || substring(id::text from 1 for 4) WHERE slug IS NULL;

-- Add monthly_streams and achievements to featured_artists
ALTER TABLE public.featured_artists ADD COLUMN IF NOT EXISTS monthly_streams bigint DEFAULT 0;
ALTER TABLE public.featured_artists ADD COLUMN IF NOT EXISTS achievements jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.featured_artists ADD COLUMN IF NOT EXISTS website_url text;
ALTER TABLE public.featured_artists ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false;
