
-- Add Solo Arena rating and earnings fields to featured_submissions
ALTER TABLE public.featured_submissions
ADD COLUMN IF NOT EXISTS rating text,
ADD COLUMN IF NOT EXISTS earned_cents integer NOT NULL DEFAULT 0;

-- Trigger to auto-credit earnings when a featured submission gets rated
CREATE OR REPLACE FUNCTION public.award_featured_submission_earnings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.earned_cents > 0 AND (OLD.earned_cents IS NULL OR OLD.earned_cents = 0) AND NEW.user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET earnings_cents = earnings_cents + NEW.earned_cents
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_featured_submission_rated
BEFORE UPDATE ON public.featured_submissions
FOR EACH ROW
EXECUTE FUNCTION public.award_featured_submission_earnings();
