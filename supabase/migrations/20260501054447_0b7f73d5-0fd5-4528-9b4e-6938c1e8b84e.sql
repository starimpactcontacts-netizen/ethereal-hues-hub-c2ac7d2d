CREATE OR REPLACE FUNCTION public.validate_competition_vote_window()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  comp RECORD;
  target_submission RECORD;
  submission_count integer;
  showcase_ends_at timestamptz;
BEGIN
  SELECT id, status, voting_started_at, voting_deadline
    INTO comp
  FROM public.competitions
  WHERE id = NEW.competition_id;

  IF comp.id IS NULL THEN
    RAISE EXCEPTION 'Competition not found';
  END IF;

  SELECT id, competition_id, user_id
    INTO target_submission
  FROM public.competition_submissions
  WHERE id = NEW.submission_id;

  IF target_submission.id IS NULL OR target_submission.competition_id <> NEW.competition_id THEN
    RAISE EXCEPTION 'Invalid competition vote target';
  END IF;

  IF target_submission.user_id = NEW.voter_id THEN
    RAISE EXCEPTION 'Editors cannot vote for their own submission';
  END IF;

  IF comp.status <> 'voting' OR comp.voting_started_at IS NULL THEN
    RAISE EXCEPTION 'Voting is not open for this competition';
  END IF;

  SELECT COUNT(*)::integer
    INTO submission_count
  FROM public.competition_submissions
  WHERE competition_id = NEW.competition_id;

  showcase_ends_at := comp.voting_started_at + make_interval(secs => GREATEST(submission_count, 0) * 15);

  IF now() < showcase_ends_at THEN
    RAISE EXCEPTION 'Voting opens after the showcase ends';
  END IF;

  IF comp.voting_deadline IS NULL OR now() >= comp.voting_deadline THEN
    RAISE EXCEPTION 'Voting is closed for this competition';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_competition_vote_window ON public.competition_votes;
CREATE TRIGGER trg_validate_competition_vote_window
  BEFORE INSERT OR UPDATE ON public.competition_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_competition_vote_window();

DROP POLICY IF EXISTS "Users cast their own vote" ON public.competition_votes;
CREATE POLICY "Users cast their own vote"
  ON public.competition_votes
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = voter_id
    AND EXISTS (
      SELECT 1
      FROM public.competitions c
      WHERE c.id = competition_id
        AND c.status = 'voting'
        AND c.voting_started_at IS NOT NULL
        AND now() >= (
          c.voting_started_at + make_interval(secs => (
            SELECT COUNT(*)::integer * 15
            FROM public.competition_submissions cs
            WHERE cs.competition_id = c.id
          ))
        )
        AND c.voting_deadline IS NOT NULL
        AND now() < c.voting_deadline
    )
    AND EXISTS (
      SELECT 1
      FROM public.competition_submissions s
      WHERE s.id = submission_id
        AND s.competition_id = competition_id
        AND s.user_id <> auth.uid()
    )
  );