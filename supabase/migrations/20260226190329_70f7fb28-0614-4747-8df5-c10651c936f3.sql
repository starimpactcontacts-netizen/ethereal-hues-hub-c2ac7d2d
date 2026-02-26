
-- Add slug, password, and featured artist to campaigns
ALTER TABLE public.artist_campaigns 
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS featured_artist_id UUID REFERENCES public.featured_artists(id) ON DELETE SET NULL;

-- Auto-generate slugs for campaigns
CREATE OR REPLACE FUNCTION public.generate_campaign_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  IF NEW.slug IS NULL OR (TG_OP = 'UPDATE' AND OLD.name != NEW.name AND NEW.slug = OLD.slug) THEN
    base_slug := LOWER(REGEXP_REPLACE(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
    base_slug := TRIM(BOTH '-' FROM base_slug);
    base_slug := SUBSTRING(base_slug FROM 1 FOR 40);
    final_slug := base_slug;
    
    WHILE EXISTS (SELECT 1 FROM public.artist_campaigns WHERE slug = final_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_campaign_slug
BEFORE INSERT OR UPDATE ON public.artist_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.generate_campaign_slug();

-- Backfill existing campaigns with slugs
DO $$
DECLARE
  rec RECORD;
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER;
BEGIN
  FOR rec IN SELECT id, name FROM public.artist_campaigns WHERE slug IS NULL LOOP
    base_slug := LOWER(REGEXP_REPLACE(REGEXP_REPLACE(rec.name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
    base_slug := TRIM(BOTH '-' FROM base_slug);
    base_slug := SUBSTRING(base_slug FROM 1 FOR 40);
    final_slug := base_slug;
    counter := 0;
    
    WHILE EXISTS (SELECT 1 FROM public.artist_campaigns WHERE slug = final_slug AND id != rec.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    
    UPDATE public.artist_campaigns SET slug = final_slug WHERE id = rec.id;
  END LOOP;
END;
$$;

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_artist_campaigns_slug ON public.artist_campaigns(slug);
