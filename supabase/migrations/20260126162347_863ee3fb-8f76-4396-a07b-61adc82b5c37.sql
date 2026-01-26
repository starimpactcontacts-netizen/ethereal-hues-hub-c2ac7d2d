-- Fix the ambiguous column reference in the trigger
CREATE OR REPLACE FUNCTION public.sync_sanctioned_tournament_player_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  actual_count INTEGER;
  ready_total INTEGER;
BEGIN
  -- Get actual participant count for the affected tournament
  IF TG_OP = 'DELETE' THEN
    SELECT COUNT(*) INTO actual_count 
    FROM public.sanctioned_tournament_participants 
    WHERE tournament_id = OLD.tournament_id;
    
    SELECT COUNT(*) INTO ready_total 
    FROM public.sanctioned_tournament_participants 
    WHERE tournament_id = OLD.tournament_id AND is_ready = true;
    
    UPDATE public.sanctioned_tournaments 
    SET player_count = actual_count, ready_count = ready_total
    WHERE id = OLD.tournament_id;
    
    RETURN OLD;
  ELSE
    SELECT COUNT(*) INTO actual_count 
    FROM public.sanctioned_tournament_participants 
    WHERE tournament_id = NEW.tournament_id;
    
    SELECT COUNT(*) INTO ready_total 
    FROM public.sanctioned_tournament_participants 
    WHERE tournament_id = NEW.tournament_id AND is_ready = true;
    
    UPDATE public.sanctioned_tournaments 
    SET player_count = actual_count, ready_count = ready_total
    WHERE id = NEW.tournament_id;
    
    RETURN NEW;
  END IF;
END;
$function$;