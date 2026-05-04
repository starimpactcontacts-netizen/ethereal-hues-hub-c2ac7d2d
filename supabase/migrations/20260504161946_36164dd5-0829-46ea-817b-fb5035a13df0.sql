
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS sound_url text;

UPDATE public.missions
SET sound_url = 'https://vt.tiktok.com/ZS9FR5LegKk9r-r67v7/'
WHERE title ILIKE '%FIX MY SOUL%';
