-- Add community URL and rules fields to hosted_competitions
ALTER TABLE public.hosted_competitions
ADD COLUMN community_url text,
ADD COLUMN rules text;