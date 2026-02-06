
-- Add category, thumbnail, and pinning to crew_announcements
ALTER TABLE public.crew_announcements
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'update',
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;

-- Add constraint for valid categories
CREATE OR REPLACE FUNCTION public.validate_announcement_category()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.category NOT IN ('event', 'update', 'recruitment', 'win') THEN
    RAISE EXCEPTION 'Invalid announcement category: %', NEW.category;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_announcement_category_trigger
  BEFORE INSERT OR UPDATE ON public.crew_announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_announcement_category();
