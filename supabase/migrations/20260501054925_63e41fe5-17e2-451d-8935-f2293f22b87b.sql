CREATE OR REPLACE FUNCTION public.finalize_competition_if_expired(p_competition_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  comp RECORD;
  top_votes integer;
  submission_count integer;
  total_votes integer;
  requester uuid := auth.uid();
  winners_marked integer := 0;
  v_showcase_seconds integer;
  v_showcase_ends timestamptz;
BEGIN
  SELECT id, status, deadline, voting_started_at, voting_deadline INTO comp
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

  v_showcase_seconds := GREATEST(submission_count, 0) * 15;

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
        voting_deadline = COALESCE(
          voting_deadline,
          now() + make_interval(secs => v_showcase_seconds) + interval '3 minutes'
        ),
        updated_at = now()
    WHERE id = p_competition_id AND status = 'live';
    RETURN true;
  END IF;

  IF comp.status <> 'voting' THEN
    RETURN false;
  END IF;

  v_showcase_ends := COALESCE(comp.voting_started_at, now()) + make_interval(secs => v_showcase_seconds);

  IF NOT (
    submission_count = 0
    OR (
      now() >= v_showcase_ends
      AND (
        submission_count = 1
        OR total_votes >= submission_count
        OR (comp.voting_deadline IS NOT NULL AND comp.voting_deadline <= now())
      )
    )
  ) THEN
    RETURN false;
  END IF;

  SELECT MAX(COALESCE(vote_count, 0)) INTO top_votes
  FROM public.competition_submissions
  WHERE competition_id = p_competition_id;

  IF top_votes IS NOT NULL THEN
    UPDATE public.competition_submissions
    SET is_winner = (COALESCE(vote_count, 0) = top_votes),
        winner_place = CASE WHEN COALESCE(vote_count, 0) = top_votes THEN 1 ELSE winner_place END,
        scored_at = CASE WHEN COALESCE(vote_count, 0) = top_votes THEN COALESCE(scored_at, now()) ELSE scored_at END
    WHERE competition_id = p_competition_id;

    GET DIAGNOSTICS winners_marked = ROW_COUNT;
  END IF;

  UPDATE public.competitions
  SET status = CASE WHEN winners_marked > 0 THEN 'completed' ELSE 'closed' END,
      updated_at = now()
  WHERE id = p_competition_id AND status = 'voting';

  PERFORM public.award_competition_rewards(p_competition_id);

  RETURN true;
END;
$function$;