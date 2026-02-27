
-- Add disqualification columns to solo_submissions
ALTER TABLE public.solo_submissions
  ADD COLUMN IF NOT EXISTS is_disqualified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS disqualify_reason TEXT;

-- Update the award_solo_index trigger to skip index if disqualified
CREATE OR REPLACE FUNCTION public.award_solo_index()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'scored' AND NEW.qoi_score IS NOT NULL AND (OLD.status IS NULL OR OLD.status != 'scored') THEN
    -- Index awarded = floor of QOI score, BUT only if not disqualified
    IF NEW.is_disqualified = true THEN
      NEW.index_awarded := 0;
    ELSE
      NEW.index_awarded := FLOOR(NEW.qoi_score)::INTEGER;
      
      -- Add to user's spendable and global index
      UPDATE public.profiles
      SET spendable_index = spendable_index + NEW.index_awarded,
          global_index_score = COALESCE(global_index_score, 0) + NEW.index_awarded
      WHERE id = NEW.user_id;
    END IF;
    
    -- Award XP regardless (they still learn from the rating)
    PERFORM public.award_xp(NEW.user_id, LEAST(FLOOR(NEW.qoi_score)::INTEGER, 50), 'solo_scored', 'Solo Mode: Scored ' || ROUND(NEW.qoi_score::NUMERIC, 1) || ' QOI');
  END IF;
  RETURN NEW;
END;
$$;
