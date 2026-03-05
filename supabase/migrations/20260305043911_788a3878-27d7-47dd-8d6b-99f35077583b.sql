ALTER TABLE public.featured_drops
ADD COLUMN IF NOT EXISTS mission_live boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS mission_custom_payouts jsonb,
ADD COLUMN IF NOT EXISTS mission_views_milestone integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS mission_views_bonus_cents integer NOT NULL DEFAULT 0;