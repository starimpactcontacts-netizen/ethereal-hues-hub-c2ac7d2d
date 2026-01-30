-- Add poster_urls array column for multiple background images
ALTER TABLE public.hosted_competitions 
ADD COLUMN poster_urls TEXT[] DEFAULT NULL;

-- Backfill existing poster_url into poster_urls array
UPDATE public.hosted_competitions 
SET poster_urls = ARRAY[poster_url]
WHERE poster_url IS NOT NULL;