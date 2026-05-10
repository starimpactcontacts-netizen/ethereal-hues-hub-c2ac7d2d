
-- Auto-maintain missions.approved_count from mission_submissions
CREATE OR REPLACE FUNCTION public.recalc_mission_approved_count(_mission_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.missions m
  SET approved_count = (
    SELECT COUNT(*) FROM public.mission_submissions
    WHERE mission_id = _mission_id AND status = 'approved'
  )
  WHERE m.id = _mission_id;
$$;

CREATE OR REPLACE FUNCTION public.trg_mission_submissions_recalc()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_mission_approved_count(OLD.mission_id);
    RETURN OLD;
  ELSE
    PERFORM public.recalc_mission_approved_count(NEW.mission_id);
    IF TG_OP = 'UPDATE' AND NEW.mission_id <> OLD.mission_id THEN
      PERFORM public.recalc_mission_approved_count(OLD.mission_id);
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS mission_submissions_recalc_count ON public.mission_submissions;
CREATE TRIGGER mission_submissions_recalc_count
AFTER INSERT OR UPDATE OF status, mission_id OR DELETE ON public.mission_submissions
FOR EACH ROW EXECUTE FUNCTION public.trg_mission_submissions_recalc();

-- Backfill existing data
UPDATE public.missions m
SET approved_count = COALESCE((
  SELECT COUNT(*) FROM public.mission_submissions s
  WHERE s.mission_id = m.id AND s.status = 'approved'
), 0);
