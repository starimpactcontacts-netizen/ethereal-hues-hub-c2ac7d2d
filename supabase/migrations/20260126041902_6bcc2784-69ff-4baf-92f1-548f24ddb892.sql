-- Add slug column to sanctioned_tournaments
ALTER TABLE public.sanctioned_tournaments
ADD COLUMN slug text UNIQUE;

-- Generate slugs for existing tournaments
UPDATE public.sanctioned_tournaments
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));

-- Create function to generate slug from name
CREATE OR REPLACE FUNCTION public.generate_tournament_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Only generate if slug is null or name changed
  IF NEW.slug IS NOT NULL AND (TG_OP = 'UPDATE' AND OLD.name = NEW.name) THEN
    RETURN NEW;
  END IF;
  
  -- Generate base slug from name
  base_slug := LOWER(REGEXP_REPLACE(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
  final_slug := base_slug;
  
  -- Check for uniqueness, add suffix if needed
  WHILE EXISTS (SELECT 1 FROM public.sanctioned_tournaments WHERE slug = final_slug AND id != NEW.id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate slug on insert/update
CREATE TRIGGER set_tournament_slug
BEFORE INSERT OR UPDATE ON public.sanctioned_tournaments
FOR EACH ROW
EXECUTE FUNCTION public.generate_tournament_slug();

-- Make slug NOT NULL after populating existing rows
ALTER TABLE public.sanctioned_tournaments
ALTER COLUMN slug SET NOT NULL;