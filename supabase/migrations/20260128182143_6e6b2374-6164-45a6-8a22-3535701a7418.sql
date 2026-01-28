-- Add columns to track rating mode and selected tier for judge reviews
ALTER TABLE public.review_requests
ADD COLUMN rating_mode text DEFAULT 'full',
ADD COLUMN selected_tier text DEFAULT NULL;

-- Add comment to explain the columns
COMMENT ON COLUMN public.review_requests.rating_mode IS 'The scoring mode used: full, vibes, two_pillar, or tier_only';
COMMENT ON COLUMN public.review_requests.selected_tier IS 'The tier selected when using tier_only mode (S, A, B, C, D, F)';