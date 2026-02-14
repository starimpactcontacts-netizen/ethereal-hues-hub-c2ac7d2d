
-- Add 'cancelled' status to quick_fights
ALTER TABLE public.quick_fights DROP CONSTRAINT IF EXISTS quick_fights_status_check;
ALTER TABLE public.quick_fights ADD CONSTRAINT quick_fights_status_check 
  CHECK (status IN ('waiting', 'active', 'submitted', 'judging', 'completed', 'forfeited', 'cancelled'));

-- Function to resolve expired quick fights
-- Called periodically or on page load
CREATE OR REPLACE FUNCTION public.resolve_expired_quick_fights()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  fight RECORD;
  resolved_count INTEGER := 0;
  p1_submitted BOOLEAN;
  p2_submitted BOOLEAN;
BEGIN
  -- Find all active fights past their end time
  FOR fight IN
    SELECT * FROM public.quick_fights
    WHERE status = 'active'
      AND ends_at IS NOT NULL
      AND ends_at < now()
    FOR UPDATE SKIP LOCKED
  LOOP
    p1_submitted := fight.player_1_submitted_at IS NOT NULL;
    p2_submitted := fight.player_2_submitted_at IS NOT NULL;

    IF NOT p1_submitted AND NOT p2_submitted THEN
      -- NEITHER submitted → cancelled, no points
      UPDATE public.quick_fights
      SET status = 'cancelled', updated_at = now()
      WHERE id = fight.id;

      -- Notify both
      INSERT INTO public.notifications (user_id, type, title, message, data) VALUES
        (fight.player_1_id, 'quick_fight_result', '⚔️ Fight Cancelled', 'Neither player submitted. No index awarded.', jsonb_build_object('fight_id', fight.id)),
        (fight.player_2_id, 'quick_fight_result', '⚔️ Fight Cancelled', 'Neither player submitted. No index awarded.', jsonb_build_object('fight_id', fight.id));

    ELSIF p1_submitted AND NOT p2_submitted THEN
      -- P1 submitted, P2 didn't → P1 wins by forfeit
      UPDATE public.quick_fights
      SET status = 'completed',
          winner_id = fight.player_1_id,
          winner_score = 100,
          loser_score = 0,
          judge_notes = 'Won by forfeit — opponent did not submit',
          judged_at = now(),
          updated_at = now()
      WHERE id = fight.id;

      -- Award +20 IDX to winner, -10 IDX to forfeiter
      UPDATE public.profiles SET spendable_index = spendable_index + 20, global_index_score = COALESCE(global_index_score, 0) + 20 WHERE id = fight.player_1_id;
      UPDATE public.profiles SET spendable_index = GREATEST(spendable_index - 10, 0), global_index_score = GREATEST(COALESCE(global_index_score, 0) - 10, 0) WHERE id = fight.player_2_id;

    ELSIF NOT p1_submitted AND p2_submitted THEN
      -- P2 submitted, P1 didn't → P2 wins by forfeit
      UPDATE public.quick_fights
      SET status = 'completed',
          winner_id = fight.player_2_id,
          winner_score = 100,
          loser_score = 0,
          judge_notes = 'Won by forfeit — opponent did not submit',
          judged_at = now(),
          updated_at = now()
      WHERE id = fight.id;

      -- Award +20 IDX to winner, -10 IDX to forfeiter
      UPDATE public.profiles SET spendable_index = spendable_index + 20, global_index_score = COALESCE(global_index_score, 0) + 20 WHERE id = fight.player_2_id;
      UPDATE public.profiles SET spendable_index = GREATEST(spendable_index - 10, 0), global_index_score = GREATEST(COALESCE(global_index_score, 0) - 10, 0) WHERE id = fight.player_1_id;
    END IF;

    resolved_count := resolved_count + 1;
  END LOOP;

  RETURN resolved_count;
END;
$$;
