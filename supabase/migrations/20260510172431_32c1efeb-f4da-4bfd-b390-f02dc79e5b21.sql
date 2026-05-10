CREATE OR REPLACE FUNCTION public.award_daily_collabs()
RETURNS TABLE(slot_id UUID, place INT, xp INT, idx INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE := (now() AT TIME ZONE 'UTC')::DATE;
  v_since TIMESTAMPTZ := (now() - interval '24 hours');
  v_winner RECORD;
  v_place INT;
  v_xp INT;
  v_idx INT;
BEGIN
  IF EXISTS (SELECT 1 FROM public.collab_daily_winners WHERE award_date = v_today) THEN
    RETURN;
  END IF;

  v_place := 1;
  FOR v_winner IN
    SELECT cs.id, cs.creator_id, cs.partner_id, cs.reaction_score
    FROM public.collab_slots cs
    WHERE cs.status = 'live'
      AND cs.live_at >= v_since
      AND cs.reaction_score > 0
      AND cs.partner_id IS NOT NULL
    ORDER BY cs.reaction_score DESC, cs.live_at ASC
    LIMIT 3
  LOOP
    IF v_place = 1 THEN v_xp := 5000; v_idx := 1000;
    ELSIF v_place = 2 THEN v_xp := 3000; v_idx := 600;
    ELSE v_xp := 1500; v_idx := 300;
    END IF;

    UPDATE public.profiles
      SET xp = COALESCE(xp, 0) + v_xp,
          spendable_index = COALESCE(spendable_index, 0) + v_idx
      WHERE id IN (v_winner.creator_id, v_winner.partner_id);

    INSERT INTO public.collab_daily_winners (award_date, place, slot_id, xp_awarded, index_awarded)
    VALUES (v_today, v_place, v_winner.id, v_xp, v_idx);

    slot_id := v_winner.id;
    place := v_place;
    xp := v_xp;
    idx := v_idx;
    RETURN NEXT;

    v_place := v_place + 1;
  END LOOP;
END;
$$;

DO $$
BEGIN
  PERFORM cron.unschedule('award-daily-collabs');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'award-daily-collabs',
  '5 0 * * *',
  $$ SELECT public.award_daily_collabs(); $$
);
