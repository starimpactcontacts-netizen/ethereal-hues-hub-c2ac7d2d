
-- Add slug to featured_drops for clean URLs
ALTER TABLE public.featured_drops ADD COLUMN IF NOT EXISTS slug TEXT;

-- Generate slugs for existing drops
UPDATE public.featured_drops 
SET slug = lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;

-- Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_featured_drops_slug ON public.featured_drops(slug) WHERE slug IS NOT NULL;

-- Auto-generate slug on insert
CREATE OR REPLACE FUNCTION public.generate_featured_drop_slug()
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
  IF NEW.slug IS NOT NULL THEN RETURN NEW; END IF;
  base_slug := lower(regexp_replace(regexp_replace(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM featured_drops WHERE slug = final_slug AND id != NEW.id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_featured_drop_slug
  BEFORE INSERT ON public.featured_drops
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_featured_drop_slug();
