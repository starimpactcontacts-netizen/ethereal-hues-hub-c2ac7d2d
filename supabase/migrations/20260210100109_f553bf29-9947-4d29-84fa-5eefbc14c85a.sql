
-- Create a function that distributes index points when a battle is completed
CREATE OR REPLACE FUNCTION public.distribute_battle_index()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run when status changes to 'completed' and there's a winner
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.winner_id IS NOT NULL THEN
    -- Award index points to winner
    UPDATE public.profiles
    SET global_index_score = COALESCE(global_index_score, 0) + COALESCE(NEW.winner_index_awarded, 20)
    WHERE id = NEW.winner_id;

    -- Determine loser and apply penalty
    IF NEW.winner_id = NEW.challenger_id AND NEW.opponent_id IS NOT NULL THEN
      UPDATE public.profiles
      SET global_index_score = GREATEST(0, COALESCE(global_index_score, 0) - COALESCE(NEW.loser_index_penalty, 5))
      WHERE id = NEW.opponent_id;
    ELSIF NEW.winner_id = NEW.opponent_id THEN
      UPDATE public.profiles
      SET global_index_score = GREATEST(0, COALESCE(global_index_score, 0) - COALESCE(NEW.loser_index_penalty, 5))
      WHERE id = NEW.challenger_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_distribute_battle_index ON public.battles;
CREATE TRIGGER trigger_distribute_battle_index
  AFTER UPDATE ON public.battles
  FOR EACH ROW
  EXECUTE FUNCTION public.distribute_battle_index();
