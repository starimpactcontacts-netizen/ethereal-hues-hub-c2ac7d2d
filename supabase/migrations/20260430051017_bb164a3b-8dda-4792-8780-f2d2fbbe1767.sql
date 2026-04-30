
ALTER TABLE public.competition_participants
  ADD COLUMN IF NOT EXISTS is_ready boolean NOT NULL DEFAULT false;

-- Allow editors to update their own ready status
DROP POLICY IF EXISTS "Users can update own participant" ON public.competition_participants;
CREATE POLICY "Users can update own participant"
ON public.competition_participants
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Auto-start when 2+ participants are all ready
CREATE OR REPLACE FUNCTION public.auto_start_competition_when_ready()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_count int;
  ready_count int;
  comp_status text;
BEGIN
  SELECT status INTO comp_status FROM public.competitions WHERE id = NEW.competition_id;
  IF comp_status <> 'lobby' THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE is_ready = true)
    INTO total_count, ready_count
  FROM public.competition_participants
  WHERE competition_id = NEW.competition_id;

  IF total_count >= 2 AND ready_count = total_count THEN
    UPDATE public.competitions
       SET status = 'live',
           started_at = now(),
           deadline = now() + interval '30 minutes'
     WHERE id = NEW.competition_id AND status = 'lobby';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_start_competition_ready ON public.competition_participants;
CREATE TRIGGER trg_auto_start_competition_ready
AFTER UPDATE OF is_ready ON public.competition_participants
FOR EACH ROW
EXECUTE FUNCTION public.auto_start_competition_when_ready();
