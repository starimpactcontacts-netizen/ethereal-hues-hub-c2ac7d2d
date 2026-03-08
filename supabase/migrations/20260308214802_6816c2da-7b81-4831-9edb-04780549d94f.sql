
-- Add CPM rate to hosted_competitions for view-based earnings
ALTER TABLE public.hosted_competitions 
  ADD COLUMN IF NOT EXISTS cpm_rate_cents integer NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS total_payout_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS earnings_last_calculated_at timestamptz;

-- Create trigger function to auto-calculate host earnings from views
CREATE OR REPLACE FUNCTION public.calculate_host_earnings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Calculate earnings: (view_count / 1000) * cpm_rate_cents
  NEW.host_earnings_cents := FLOOR(COALESCE(NEW.view_count, 0)::numeric / 1000 * COALESCE(NEW.cpm_rate_cents, 500));
  NEW.earnings_last_calculated_at := now();
  RETURN NEW;
END;
$$;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS trg_calculate_host_earnings ON public.hosted_competitions;
CREATE TRIGGER trg_calculate_host_earnings
  BEFORE UPDATE OF view_count ON public.hosted_competitions
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_host_earnings();

-- Add lifecycle columns to sanctioned_tournaments if not exists
ALTER TABLE public.sanctioned_tournaments
  ADD COLUMN IF NOT EXISTS submissions_open_at timestamptz,
  ADD COLUMN IF NOT EXISTS submissions_close_at timestamptz,
  ADD COLUMN IF NOT EXISTS judging_open_at timestamptz,
  ADD COLUMN IF NOT EXISTS judging_close_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;
