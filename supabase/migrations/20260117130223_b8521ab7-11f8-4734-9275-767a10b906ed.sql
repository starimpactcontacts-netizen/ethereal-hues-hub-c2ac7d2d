-- Update the trigger to add class floor index points when GQT is scored
CREATE OR REPLACE FUNCTION public.update_best_gatekeeper_qoi()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  old_best NUMERIC;
  old_floor INTEGER;
  new_floor INTEGER;
  floor_diff INTEGER;
BEGIN
  IF NEW.status = 'scored' AND NEW.qoi_score IS NOT NULL THEN
    -- Get current best score
    SELECT COALESCE(best_gatekeeper_qoi, 0) INTO old_best
    FROM public.profiles WHERE id = NEW.user_id;
    
    -- Only process if this is a new high score
    IF NEW.qoi_score > old_best THEN
      -- Calculate old floor based on old best score
      old_floor := CASE
        WHEN old_best >= 95 THEN 300  -- S++
        WHEN old_best >= 85 THEN 200  -- S+
        WHEN old_best >= 75 THEN 120  -- S
        WHEN old_best >= 65 THEN 75   -- A
        WHEN old_best >= 50 THEN 40   -- B
        WHEN old_best >= 40 THEN 20   -- C
        WHEN old_best >= 30 THEN 10   -- D
        ELSE 0                         -- F
      END;
      
      -- Calculate new floor based on new score
      new_floor := CASE
        WHEN NEW.qoi_score >= 95 THEN 300  -- S++
        WHEN NEW.qoi_score >= 85 THEN 200  -- S+
        WHEN NEW.qoi_score >= 75 THEN 120  -- S
        WHEN NEW.qoi_score >= 65 THEN 75   -- A
        WHEN NEW.qoi_score >= 50 THEN 40   -- B
        WHEN NEW.qoi_score >= 40 THEN 20   -- C
        WHEN NEW.qoi_score >= 30 THEN 10   -- D
        ELSE 0                              -- F
      END;
      
      -- Calculate difference to add
      floor_diff := new_floor - old_floor;
      
      -- Update profile with new best and add floor difference to index scores
      UPDATE public.profiles
      SET best_gatekeeper_qoi = NEW.qoi_score,
          global_index_score = COALESCE(global_index_score, 0) + floor_diff,
          spendable_index = spendable_index + floor_diff
      WHERE id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;