
-- 10x another bump on Index economy: battle defaults, competition pools, solo index, hosted comp tiers

-- Battle distribution: bump default winner reward & loser penalty 10x
CREATE OR REPLACE FUNCTION public.distribute_battle_index()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.winner_id IS NOT NULL THEN
    UPDATE public.profiles
    SET global_index_score = COALESCE(global_index_score, 0) + COALESCE(NEW.winner_index_awarded, 200)
    WHERE id = NEW.winner_id;

    IF NEW.winner_id = NEW.challenger_id AND NEW.opponent_id IS NOT NULL THEN
      UPDATE public.profiles
      SET global_index_score = GREATEST(0, COALESCE(global_index_score, 0) - COALESCE(NEW.loser_index_penalty, 50))
      WHERE id = NEW.opponent_id;
    ELSIF NEW.winner_id = NEW.opponent_id THEN
      UPDATE public.profiles
      SET global_index_score = GREATEST(0, COALESCE(global_index_score, 0) - COALESCE(NEW.loser_index_penalty, 50))
      WHERE id = NEW.challenger_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Hosted competition reward pool tiers (10x bump)
CREATE OR REPLACE FUNCTION public.calculate_comp_index_reward(participant_count integer)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN participant_count >= 100 THEN 50000
    WHEN participant_count >= 75 THEN 35000
    WHEN participant_count >= 50 THEN 20000
    WHEN participant_count >= 25 THEN 10000
    WHEN participant_count >= 10 THEN 5000
    WHEN participant_count >= 5 THEN 2500
    WHEN participant_count >= 2 THEN 1000
    ELSE 0
  END
$function$;

-- Open competitions reward pool (10x bump)
CREATE OR REPLACE FUNCTION public.update_competition_reward_pool()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.competitions
  SET index_reward_pool = CASE
    WHEN current_players >= 100 THEN 50000
    WHEN current_players >= 75 THEN 35000
    WHEN current_players >= 50 THEN 20000
    WHEN current_players >= 25 THEN 10000
    WHEN current_players >= 10 THEN 5000
    WHEN current_players >= 5 THEN 2500
    WHEN current_players >= 2 THEN 1000
    ELSE 0
  END
  WHERE id = COALESCE(NEW.competition_id, OLD.competition_id);
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Solo index payout: floor(qoi * 100) (was 10), and XP cap 5000 (was 500)
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
      NEW.index_awarded := FLOOR(NEW.qoi_score * 100)::INTEGER;

      UPDATE public.profiles
      SET spendable_index = spendable_index + NEW.index_awarded,
          global_index_score = COALESCE(global_index_score, 0) + NEW.index_awarded
      WHERE id = NEW.user_id;
    END IF;

    PERFORM public.award_xp(NEW.user_id, LEAST(FLOOR(NEW.qoi_score * 100)::INTEGER, 5000), 'solo_scored', 'Solo Mode: Scored ' || ROUND(NEW.qoi_score::NUMERIC, 1) || ' QOI');
  END IF;
  RETURN NEW;
END;
$function$;
