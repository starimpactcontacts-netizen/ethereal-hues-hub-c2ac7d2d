
CREATE OR REPLACE FUNCTION public.auto_start_full_competition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mins INTEGER;
BEGIN
  IF NEW.status = 'lobby' AND NEW.current_players >= NEW.max_players THEN
    mins := COALESCE(NEW.duration_minutes, 30);
    NEW.status := 'live';
    NEW.started_at := now();
    NEW.deadline := now() + (mins || ' minutes')::interval;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_start_full_competition ON public.competitions;
CREATE TRIGGER trg_auto_start_full_competition
BEFORE UPDATE OF current_players, max_players ON public.competitions
FOR EACH ROW
EXECUTE FUNCTION public.auto_start_full_competition();

-- Kick off n0va's Room and any other already-full lobbies
UPDATE public.competitions
SET status = 'live',
    started_at = now(),
    deadline = now() + (COALESCE(duration_minutes, 30) || ' minutes')::interval
WHERE status = 'lobby' AND current_players >= max_players;
