-- Add slug column to hosted_competitions
ALTER TABLE public.hosted_competitions 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create function to generate hosted comp slug
CREATE OR REPLACE FUNCTION public.generate_hosted_comp_slug(comp_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert name to slug format
  base_slug := lower(regexp_replace(comp_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  base_slug := substring(base_slug from 1 for 50);
  
  final_slug := base_slug;
  
  -- Check for uniqueness and add counter if needed
  WHILE EXISTS (SELECT 1 FROM hosted_competitions WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-set slug on insert
CREATE OR REPLACE FUNCTION public.set_hosted_comp_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := generate_hosted_comp_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS set_hosted_comp_slug_trigger ON hosted_competitions;
CREATE TRIGGER set_hosted_comp_slug_trigger
  BEFORE INSERT ON hosted_competitions
  FOR EACH ROW
  EXECUTE FUNCTION set_hosted_comp_slug();

-- Backfill existing competitions with slugs
UPDATE hosted_competitions 
SET slug = generate_hosted_comp_slug(name)
WHERE slug IS NULL;