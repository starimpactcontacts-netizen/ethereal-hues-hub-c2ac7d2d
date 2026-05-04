
-- Add INSERT triggers so battles created already-active get scenepack options
CREATE OR REPLACE FUNCTION public.trg_assign_scenepack_options()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_pair record; v_should boolean := false;
BEGIN
  IF NEW.scenepack_option_a_id IS NOT NULL THEN RETURN NEW; END IF;

  IF TG_OP = 'INSERT' THEN
    IF (TG_TABLE_NAME = 'battles' AND NEW.status = 'active')
       OR (TG_TABLE_NAME = 'cash_battles' AND NEW.status IN ('live','active')) THEN
      v_should := true;
    END IF;
  ELSE
    IF (TG_TABLE_NAME = 'battles' AND NEW.status = 'active' AND (OLD.status IS DISTINCT FROM 'active'))
       OR (TG_TABLE_NAME = 'cash_battles' AND NEW.status IN ('live','active') AND (OLD.status IS DISTINCT FROM NEW.status)) THEN
      v_should := true;
    END IF;
  END IF;

  IF v_should THEN
    SELECT * INTO v_pair FROM public.pick_random_scenepack_pair();
    IF v_pair.a IS NOT NULL THEN
      NEW.scenepack_option_a_id := v_pair.a;
      NEW.scenepack_option_b_id := v_pair.b;
      NEW.scenepack_vote_started_at := now();
      NEW.scenepack_vote_deadline := now() + interval '30 seconds';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_scenepack_battles_ins ON public.battles;
CREATE TRIGGER trg_assign_scenepack_battles_ins
  BEFORE INSERT ON public.battles
  FOR EACH ROW EXECUTE FUNCTION public.trg_assign_scenepack_options();

DROP TRIGGER IF EXISTS trg_assign_scenepack_cash_battles_ins ON public.cash_battles;
CREATE TRIGGER trg_assign_scenepack_cash_battles_ins
  BEFORE INSERT ON public.cash_battles
  FOR EACH ROW EXECUTE FUNCTION public.trg_assign_scenepack_options();

-- Backfill: assign options + fresh 30s window to active battles missing them
DO $$
DECLARE r record; v_pair record;
BEGIN
  FOR r IN SELECT id FROM public.battles WHERE status='active' AND scenepack_option_a_id IS NULL AND scenepack_locked_id IS NULL LOOP
    SELECT * INTO v_pair FROM public.pick_random_scenepack_pair();
    IF v_pair.a IS NOT NULL THEN
      UPDATE public.battles SET
        scenepack_option_a_id = v_pair.a,
        scenepack_option_b_id = v_pair.b,
        scenepack_vote_started_at = now(),
        scenepack_vote_deadline = now() + interval '30 seconds'
      WHERE id = r.id;
    END IF;
  END LOOP;

  FOR r IN SELECT id FROM public.cash_battles WHERE status IN ('live','active') AND scenepack_option_a_id IS NULL AND scenepack_locked_id IS NULL LOOP
    SELECT * INTO v_pair FROM public.pick_random_scenepack_pair();
    IF v_pair.a IS NOT NULL THEN
      UPDATE public.cash_battles SET
        scenepack_option_a_id = v_pair.a,
        scenepack_option_b_id = v_pair.b,
        scenepack_vote_started_at = now(),
        scenepack_vote_deadline = now() + interval '30 seconds'
      WHERE id = r.id;
    END IF;
  END LOOP;
END $$;
