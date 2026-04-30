CREATE OR REPLACE FUNCTION public.auto_advance_competition_on_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  total_count integer;
  submission_count integer;
  comp_status text;
BEGIN
  SELECT status INTO comp_status
  FROM public.competitions
  WHERE id = NEW.competition_id;

  IF comp_status <> 'live' THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*)::integer INTO total_count
  FROM public.competition_participants
  WHERE competition_id = NEW.competition_id;

  SELECT COUNT(*)::integer INTO submission_count
  FROM public.competition_submissions
  WHERE competition_id = NEW.competition_id;

  IF total_count > 0 AND submission_count >= total_count THEN
    UPDATE public.competitions
    SET status = 'voting',
        voting_started_at = now(),
        voting_deadline = now() + interval '2 minutes',
        updated_at = now()
    WHERE id = NEW.competition_id AND status = 'live';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_advance_competition_on_submission ON public.competition_submissions;
CREATE TRIGGER trg_auto_advance_competition_on_submission
AFTER INSERT ON public.competition_submissions
FOR EACH ROW
EXECUTE FUNCTION public.auto_advance_competition_on_submission();