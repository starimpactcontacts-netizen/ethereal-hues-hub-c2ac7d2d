-- Add is_featured column to hosted_competitions
ALTER TABLE public.hosted_competitions
ADD COLUMN is_featured boolean DEFAULT false,
ADD COLUMN featured_at timestamp with time zone;

-- Create index for featured comps queries
CREATE INDEX idx_hosted_competitions_featured ON public.hosted_competitions(is_featured, status) WHERE is_featured = true;