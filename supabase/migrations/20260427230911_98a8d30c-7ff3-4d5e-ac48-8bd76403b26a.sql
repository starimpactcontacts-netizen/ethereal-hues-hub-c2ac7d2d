-- 10x competition reward pools (drives both `competitions` and `hosted_competitions` via the two trigger funcs)
CREATE OR REPLACE FUNCTION public.calculate_comp_index_reward(participant_count integer)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN participant_count >= 100 THEN 5000
    WHEN participant_count >= 75 THEN 3500
    WHEN participant_count >= 50 THEN 2000
    WHEN participant_count >= 25 THEN 1000
    WHEN participant_count >= 10 THEN 500
    WHEN participant_count >= 5 THEN 250
    WHEN participant_count >= 2 THEN 100
    ELSE 0
  END
$function$;

CREATE OR REPLACE FUNCTION public.update_competition_reward_pool()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.competitions
  SET index_reward_pool = CASE
    WHEN current_players >= 100 THEN 5000
    WHEN current_players >= 75 THEN 3500
    WHEN current_players >= 50 THEN 2000
    WHEN current_players >= 25 THEN 1000
    WHEN current_players >= 10 THEN 500
    WHEN current_players >= 5 THEN 250
    WHEN current_players >= 2 THEN 100
    ELSE 0
  END
  WHERE id = COALESCE(NEW.competition_id, OLD.competition_id);
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 10x solo mode index payout (was floor(qoi_score), now floor(qoi_score * 10))
CREATE OR REPLACE FUNCTION public.award_solo_index()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'scored' AND NEW.qoi_score IS NOT NULL AND (OLD.status IS NULL OR OLD.status != 'scored') THEN
    -- Index awarded = floor of QOI score * 10, BUT only if not disqualified
    IF NEW.is_disqualified = true THEN
      NEW.index_awarded := 0;
    ELSE
      NEW.index_awarded := FLOOR(NEW.qoi_score * 10)::INTEGER;

      -- Add to user's spendable and global index
      UPDATE public.profiles
      SET spendable_index = spendable_index + NEW.index_awarded,
          global_index_score = COALESCE(global_index_score, 0) + NEW.index_awarded
      WHERE id = NEW.user_id;
    END IF;

    -- Award XP regardless (10x scaled, capped at 500)
    PERFORM public.award_xp(NEW.user_id, LEAST(FLOOR(NEW.qoi_score * 10)::INTEGER, 500), 'solo_scored', 'Solo Mode: Scored ' || ROUND(NEW.qoi_score::NUMERIC, 1) || ' QOI');
  END IF;
  RETURN NEW;
END;
$function$;

-- 10x default battle index rewards/penalties for newly created battles
ALTER TABLE public.battles
  ALTER COLUMN winner_index_awarded SET DEFAULT 200,
  ALTER COLUMN loser_index_penalty SET DEFAULT 50;