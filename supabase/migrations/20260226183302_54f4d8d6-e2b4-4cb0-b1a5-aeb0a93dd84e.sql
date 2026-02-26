
-- Add promoted flag to featured_drops for campaign-priority drops
ALTER TABLE public.featured_drops ADD COLUMN IF NOT EXISTS is_promoted boolean NOT NULL DEFAULT false;

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_featured_drops_promoted ON public.featured_drops (is_promoted) WHERE is_promoted = true;
