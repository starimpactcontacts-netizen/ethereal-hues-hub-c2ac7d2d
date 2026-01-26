-- Fix function search path
CREATE OR REPLACE FUNCTION public.generate_tournament_slug()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;