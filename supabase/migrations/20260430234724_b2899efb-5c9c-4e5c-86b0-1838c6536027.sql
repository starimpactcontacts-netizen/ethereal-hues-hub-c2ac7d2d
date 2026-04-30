
-- Award rewards (XP + Index) when a competition completes.
-- Splits the IDX prize pool equally among all tied top-vote submissions.
-- Every participant who submitted gets a base XP for showing up.
CREATE OR REPLACE FUNCTION public.award_competition_rewards(p_competition_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  comp RECORD;
  winner_count integer := 0;
  per_winner_idx integer := 0;
  per_winner_xp integer := 0;
  base_xp integer := 5000;       -- participation XP (matches submit_edit reward)
  win_bonus_xp integer := 30000; -- winner XP pool to split (matches event_win)
  rec RECORD;
BEGIN
  SELECT id, name, index_reward_pool
    INTO comp
  FROM public.competitions
  WHERE id = p_competition_id;

  IF comp.id IS NULL THEN RETURN; END IF;

  -- Idempotency guard: if anyone already got a comp_win reward for this comp, bail.
  IF EXISTS (
    SELECT 1 FROM public.xp_history
    WHERE action = 'competition_win'
      AND description LIKE '%' || comp.id::text || '%'
  ) THEN
    RETURN;
  END IF;

  -- Count winners (handles ties — finalize step sets is_winner=true for every tied top submission)
  SELECT COUNT(*) INTO winner_count
  FROM public.competition_submissions
  WHERE competition_id = p_competition_id AND is_winner = true;

  IF winner_count > 0 THEN
    per_winner_idx := FLOOR(COALESCE(comp.index_reward_pool, 0)::numeric / winner_count)::integer;
    per_winner_xp  := FLOOR(win_bonus_xp::numeric / winner_count)::integer;
  END IF;

  -- Participation XP for everyone who submitted
  FOR rec IN
    SELECT DISTINCT user_id
    FROM public.competition_submissions
    WHERE competition_id = p_competition_id AND user_id IS NOT NULL
  LOOP
    PERFORM public.award_xp(
      rec.user_id,
      base_xp,
      'competition_submit',
      'Competition: submitted edit · ' || comp.id::text
    );
  END LOOP;

  -- Winner rewards (split pool + bonus XP)
  IF winner_count > 0 THEN
    FOR rec IN
      SELECT DISTINCT user_id
      FROM public.competition_submissions
      WHERE competition_id = p_competition_id AND is_winner = true AND user_id IS NOT NULL
    LOOP
      IF per_winner_idx > 0 THEN
        UPDATE public.profiles
        SET spendable_index = COALESCE(spendable_index, 0) + per_winner_idx,
            global_index_score = COALESCE(global_index_score, 0) + per_winner_idx,
            total_wins = COALESCE(total_wins, 0) + CASE WHEN winner_count = 1 THEN 1 ELSE 0 END
        WHERE id = rec.user_id;
      ELSE
        UPDATE public.profiles
        SET total_wins = COALESCE(total_wins, 0) + CASE WHEN winner_count = 1 THEN 1 ELSE 0 END
        WHERE id = rec.user_id;
      END IF;

      PERFORM public.award_xp(
        rec.user_id,
        per_winner_xp,
        'competition_win',
        CASE WHEN winner_count > 1
             THEN 'Competition: tied winner (split) · ' || comp.id::text
             ELSE 'Competition: winner · ' || comp.id::text END
      );
    END LOOP;
  END IF;
END;
$$;

-- Update finalize function to mark ALL tied top-vote submissions as winners
-- and invoke the reward distribution at completion.
CREATE OR REPLACE FUNCTION public.finalize_competition_if_expired(p_competition_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  comp RECORD;
  top_votes integer;
  submission_count integer;
  total_votes integer;
  requester uuid := auth.uid();
  winners_marked integer := 0;
BEGIN
  SELECT id, status, deadline, voting_deadline INTO comp
  FROM public.competitions
  WHERE id = p_competition_id;

  IF comp.id IS NULL THEN RETURN false; END IF;
  IF requester IS NULL THEN RETURN false; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.competitions c
    WHERE c.id = p_competition_id AND c.creator_id = requester
  ) AND NOT EXISTS (
    SELECT 1 FROM public.competition_participants cp
    WHERE cp.competition_id = p_competition_id AND cp.user_id = requester
  ) THEN
    RETURN false;
  END IF;

  SELECT COUNT(*)::integer, COALESCE(SUM(COALESCE(vote_count, 0)), 0)::integer
    INTO submission_count, total_votes
  FROM public.competition_submissions
  WHERE competition_id = p_competition_id;

  -- Move expired live → voting (or close if no submissions)
  IF comp.status = 'live' AND comp.deadline IS NOT NULL AND comp.deadline <= now() THEN
    IF submission_count = 0 THEN
      UPDATE public.competitions
      SET status = 'closed', updated_at = now()
      WHERE id = p_competition_id AND status = 'live';
      RETURN true;
    END IF;

    UPDATE public.competitions
    SET status = 'voting',
        voting_started_at = COALESCE(voting_started_at, now()),
        voting_deadline = COALESCE(voting_deadline, now() + interval '2 minutes'),
        updated_at = now()
    WHERE id = p_competition_id AND status = 'live';
    RETURN true;
  END IF;

  IF comp.status <> 'voting' THEN
    RETURN false;
  END IF;

  IF NOT (
    submission_count = 0
    OR submission_count = 1
    OR total_votes >= submission_count
    OR (comp.voting_deadline IS NOT NULL AND comp.voting_deadline <= now())
  ) THEN
    RETURN false;
  END IF;

  -- Find the top vote count
  SELECT MAX(COALESCE(vote_count, 0)) INTO top_votes
  FROM public.competition_submissions
  WHERE competition_id = p_competition_id;

  -- Mark every submission tied at top_votes as a winner (handles ties)
  IF top_votes IS NOT NULL THEN
    UPDATE public.competition_submissions
    SET is_winner = (COALESCE(vote_count, 0) = top_votes),
        winner_place = CASE WHEN COALESCE(vote_count, 0) = top_votes THEN 1 ELSE winner_place END,
        scored_at = CASE WHEN COALESCE(vote_count, 0) = top_votes THEN COALESCE(scored_at, now()) ELSE scored_at END
    WHERE competition_id = p_competition_id;

    GET DIAGNOSTICS winners_marked = ROW_COUNT;
  END IF;

  UPDATE public.competitions
  SET status = CASE WHEN winners_marked = 0 OR submission_count = 0 THEN 'closed' ELSE 'completed' END,
      updated_at = now()
  WHERE id = p_competition_id AND status = 'voting';

  -- Distribute XP + IDX rewards (idempotent inside)
  PERFORM public.award_competition_rewards(p_competition_id);

  RETURN true;
END;
$$;
