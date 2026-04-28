CREATE OR REPLACE FUNCTION public.award_solo_index()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'scored' AND NEW.qoi_score IS NOT NULL AND (OLD.status IS NULL OR OLD.status != 'scored') THEN
    IF NEW.is_disqualified = true THEN
      NEW.index_awarded := 0;
    ELSE
      NEW.index_awarded := FLOOR(NEW.qoi_score * 1000)::INTEGER;

      UPDATE public.profiles
      SET spendable_index = spendable_index + NEW.index_awarded,
          global_index_score = COALESCE(global_index_score, 0) + NEW.index_awarded
      WHERE id = NEW.user_id;
    END IF;

    PERFORM public.award_xp(NEW.user_id, LEAST(FLOOR(NEW.qoi_score * 1000)::INTEGER, 10000), 'solo_scored', 'Solo Mode: Scored ' || ROUND(NEW.qoi_score::NUMERIC, 1) || ' QOI');
  END IF;
  RETURN NEW;
END;
$function$;