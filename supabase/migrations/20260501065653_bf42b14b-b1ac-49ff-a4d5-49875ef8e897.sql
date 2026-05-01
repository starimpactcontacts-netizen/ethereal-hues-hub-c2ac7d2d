
-- ─── Battle showcase + judging deadline + public vote fallback ─────────
ALTER TABLE public.battles
  ADD COLUMN IF NOT EXISTS showcase_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS judging_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS public_vote_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS public_vote_deadline TIMESTAMPTZ;

-- When both edits are submitted, kick off the showcase clock and the 30-min judge window
CREATE OR REPLACE FUNCTION public.start_battle_showcase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.challenger_submitted_at IS NOT NULL
     AND NEW.opponent_submitted_at IS NOT NULL
     AND NEW.showcase_started_at IS NULL
     AND NEW.status IN ('active','judging')
  THEN
    NEW.showcase_started_at := now();
    NEW.judging_deadline   := now() + interval '30 minutes';
    NEW.status             := 'judging';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_start_battle_showcase ON public.battles;
CREATE TRIGGER trg_start_battle_showcase
BEFORE UPDATE ON public.battles
FOR EACH ROW
EXECUTE FUNCTION public.start_battle_showcase();

-- Finalize a battle whose timers have expired:
--   • If 30-min judge window passed and no judge verdict → open 15-min public vote
--   • If 15-min public vote window passed → declare winner by community votes
CREATE OR REPLACE FUNCTION public.finalize_battle_if_expired(p_battle_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  b RECORD;
  v_winner uuid;
BEGIN
  SELECT * INTO b FROM public.battles WHERE id = p_battle_id;
  IF NOT FOUND THEN RETURN; END IF;

  -- Step 1: judge window expired → open public vote
  IF b.status = 'judging'
     AND b.judged_at IS NULL
     AND b.judging_deadline IS NOT NULL
     AND now() >= b.judging_deadline
     AND b.public_vote_started_at IS NULL
  THEN
    UPDATE public.battles
       SET public_vote_started_at = now(),
           public_vote_deadline   = now() + interval '15 minutes'
     WHERE id = p_battle_id;
    RETURN;
  END IF;

  -- Step 2: public vote window expired → finalize by votes
  IF b.status = 'judging'
     AND b.judged_at IS NULL
     AND b.public_vote_deadline IS NOT NULL
     AND now() >= b.public_vote_deadline
  THEN
    IF b.challenger_votes > b.opponent_votes THEN
      v_winner := b.challenger_id;
    ELSIF b.opponent_votes > b.challenger_votes THEN
      v_winner := b.opponent_id;
    ELSE
      -- Tie → challenger wins (defender's-advantage off; pick deterministic side)
      v_winner := b.challenger_id;
    END IF;

    UPDATE public.battles
       SET winner_id            = v_winner,
           challenger_score     = b.challenger_votes,
           opponent_score       = b.opponent_votes,
           judge_notes          = 'Decided by public vote',
           judged_at            = now(),
           status               = 'completed'
     WHERE id = p_battle_id;
  END IF;
END;
$$;
