-- Create a trigger function to automatically sync player_count when participants change
CREATE OR REPLACE FUNCTION public.sync_sanctioned_tournament_player_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  actual_count INTEGER;
  ready_count INTEGER;
BEGIN
  -- Get actual participant count for the affected tournament
  IF TG_OP = 'DELETE' THEN
    SELECT COUNT(*) INTO actual_count 
    FROM public.sanctioned_tournament_participants 
    WHERE tournament_id = OLD.tournament_id;
    
    SELECT COUNT(*) INTO ready_count 
    FROM public.sanctioned_tournament_participants 
    WHERE tournament_id = OLD.tournament_id AND is_ready = true;
    
    UPDATE public.sanctioned_tournaments 
    SET player_count = actual_count, ready_count = ready_count
    WHERE id = OLD.tournament_id;
    
    RETURN OLD;
  ELSE
    SELECT COUNT(*) INTO actual_count 
    FROM public.sanctioned_tournament_participants 
    WHERE tournament_id = NEW.tournament_id;
    
    SELECT COUNT(*) INTO ready_count 
    FROM public.sanctioned_tournament_participants 
    WHERE tournament_id = NEW.tournament_id AND is_ready = true;
    
    UPDATE public.sanctioned_tournaments 
    SET player_count = actual_count, ready_count = ready_count
    WHERE id = NEW.tournament_id;
    
    RETURN NEW;
  END IF;
END;
$$;

-- Create trigger for INSERT, UPDATE, DELETE on participants table
DROP TRIGGER IF EXISTS sync_player_count_trigger ON public.sanctioned_tournament_participants;
CREATE TRIGGER sync_player_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.sanctioned_tournament_participants
FOR EACH ROW
EXECUTE FUNCTION public.sync_sanctioned_tournament_player_count();