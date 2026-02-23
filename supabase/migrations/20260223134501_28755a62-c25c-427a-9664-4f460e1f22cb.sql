-- Add review_tag and notes columns to review_requests so they actually persist
ALTER TABLE public.review_requests ADD COLUMN IF NOT EXISTS review_tag text;
ALTER TABLE public.review_requests ADD COLUMN IF NOT EXISTS notes text;