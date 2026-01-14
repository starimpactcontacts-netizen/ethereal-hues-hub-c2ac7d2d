-- Add materials_url field to events table for storing links to sounds, footage, assets etc.
ALTER TABLE public.events
ADD COLUMN materials_url TEXT NULL;

-- Add a comment to describe the column
COMMENT ON COLUMN public.events.materials_url IS 'URL to materials/resources for the event (sound links, footage, assets, etc.)';