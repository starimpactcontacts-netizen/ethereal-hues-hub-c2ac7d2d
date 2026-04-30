DROP POLICY IF EXISTS "Participants can close expired voting" ON public.competitions;

CREATE OR REPLACE FUNCTION public.finalize_competition_if_expired(p_competition_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  comp RECORD;
  winner_id UUID;
  submission_count integer;
  total_votes integer;
  requester uuid := auth.uid();
BEGIN
  SELECT id, status, deadline, voting_deadline INTO comp
  FROM public.competitions
  WHERE id = p_competition_id;

  IF comp.id IS NULL THEN
    RETURN false;
  END IF;

  IF requester IS NULL THEN
    RETURN false;
  END IF;

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

  SELECT id INTO winner_id
  FROM public.competition_submissions
  WHERE competition_id = p_competition_id
  ORDER BY COALESCE(vote_count, 0) DESC, created_at DESC
  LIMIT 1;

  IF winner_id IS NOT NULL THEN
    UPDATE public.competition_submissions
    SET is_winner = (id = winner_id),
        winner_place = CASE WHEN id = winner_id THEN 1 ELSE winner_place END,
        scored_at = CASE WHEN id = winner_id THEN COALESCE(scored_at, now()) ELSE scored_at END
    WHERE competition_id = p_competition_id;
  END IF;

  UPDATE public.competitions
  SET status = CASE WHEN winner_id IS NULL THEN 'closed' ELSE 'completed' END,
      updated_at = now()
  WHERE id = p_competition_id AND status = 'voting';

  RETURN true;
END;
$$;