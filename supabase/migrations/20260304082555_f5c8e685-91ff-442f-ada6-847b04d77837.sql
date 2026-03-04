
-- Add custom payouts and views milestone fields to featured_drops for per-campaign payout configuration
ALTER TABLE public.featured_drops 
ADD COLUMN IF NOT EXISTS custom_payouts jsonb DEFAULT '{"S": 500, "A": 300, "B": 100, "C": 0, "D": 0, "F": 0}'::jsonb,
ADD COLUMN IF NOT EXISTS views_milestone integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS views_bonus_cents integer DEFAULT 0;

COMMENT ON COLUMN public.featured_drops.custom_payouts IS 'Per-tier payout in cents: {"S": 500, "A": 300, "B": 100, ...}';
COMMENT ON COLUMN public.featured_drops.views_milestone IS 'Views threshold for bonus eligibility (0 = disabled)';
COMMENT ON COLUMN public.featured_drops.views_bonus_cents IS 'Bonus payout in cents when views milestone is hit (C+ rated only, F excluded)';
