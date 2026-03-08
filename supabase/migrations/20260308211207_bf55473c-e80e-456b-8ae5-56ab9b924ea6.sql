
-- Add earnings tracking for hosted competitions
ALTER TABLE public.hosted_competitions
ADD COLUMN IF NOT EXISTS host_earnings_cents integer NOT NULL DEFAULT 0;

-- Add a comment for clarity
COMMENT ON COLUMN public.hosted_competitions.host_earnings_cents IS 'Calculated earnings based on views and participants. Formula: (view_count * 0.5 + participant_count * 2) cents';
