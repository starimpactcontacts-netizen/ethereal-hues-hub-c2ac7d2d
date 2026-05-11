-- 1) Backfill the missing battle (Kaizen×OXNY challenged vax_edits×quinx)
INSERT INTO public.collab_battles (slot_a_id, slot_b_id)
SELECT s.challenges_slot_id, s.id
FROM public.collab_slots s
WHERE s.status = 'live'
  AND s.challenges_slot_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.collab_slots t
    WHERE t.id = s.challenges_slot_id AND t.status = 'live'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.collab_battles b
    WHERE b.slot_a_id IN (s.id, s.challenges_slot_id)
       OR b.slot_b_id IN (s.id, s.challenges_slot_id)
  );

-- 2) Update the auto-matchmake trigger to prefer the explicit challenge target
CREATE OR REPLACE FUNCTION public.trg_auto_matchmake_collab_battle()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_opponent_id UUID;
BEGIN
  IF NEW.status = 'live' AND (OLD.status IS DISTINCT FROM 'live') THEN
    IF EXISTS (
      SELECT 1 FROM public.collab_battles
      WHERE slot_a_id = NEW.id OR slot_b_id = NEW.id
    ) THEN
      RETURN NEW;
    END IF;

    -- Prefer explicit challenge target if it's live and free
    IF NEW.challenges_slot_id IS NOT NULL THEN
      SELECT s.id INTO v_opponent_id
      FROM public.collab_slots s
      WHERE s.id = NEW.challenges_slot_id
        AND s.status = 'live'
        AND NOT EXISTS (
          SELECT 1 FROM public.collab_battles b
          WHERE b.slot_a_id = s.id OR b.slot_b_id = s.id
        )
      LIMIT 1;
    END IF;

    -- Fallback: any orphan live duo
    IF v_opponent_id IS NULL THEN
      SELECT s.id INTO v_opponent_id
      FROM public.collab_slots s
      WHERE s.status = 'live'
        AND s.id <> NEW.id
        AND s.creator_id <> NEW.creator_id
        AND (NEW.partner_id IS NULL OR s.creator_id <> NEW.partner_id)
        AND (s.partner_id IS NULL OR s.partner_id <> NEW.creator_id)
        AND NOT EXISTS (
          SELECT 1 FROM public.collab_battles b
          WHERE b.slot_a_id = s.id OR b.slot_b_id = s.id
        )
      ORDER BY s.live_at ASC NULLS LAST
      LIMIT 1;
    END IF;

    IF v_opponent_id IS NOT NULL THEN
      INSERT INTO public.collab_battles (slot_a_id, slot_b_id)
      VALUES (v_opponent_id, NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;