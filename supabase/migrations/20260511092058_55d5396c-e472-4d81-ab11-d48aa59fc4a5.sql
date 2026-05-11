ALTER TABLE public.collab_slots
  ADD COLUMN IF NOT EXISTS submit_deadline_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.collab_slot_lifecycle()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Just paired
  IF NEW.partner_id IS NOT NULL AND OLD.partner_id IS NULL THEN
    NEW.paired_at := now();
    NEW.submit_deadline_at := now() + interval '3 hours';
    IF NEW.status = 'open' THEN
      NEW.status := 'paired';
    END IF;
  END IF;

  -- Just uploaded
  IF NEW.final_video_url IS NOT NULL AND (OLD.final_video_url IS NULL OR OLD.final_video_url <> NEW.final_video_url) THEN
    NEW.uploaded_at := now();
    IF NEW.uploaded_by = NEW.creator_id THEN
      NEW.creator_approved := TRUE;
      NEW.partner_approved := FALSE;
    ELSIF NEW.uploaded_by = NEW.partner_id THEN
      NEW.partner_approved := TRUE;
      NEW.creator_approved := FALSE;
    END IF;
    NEW.status := 'pending_approval';
  END IF;

  -- Both approved → live
  IF NEW.creator_approved AND NEW.partner_approved AND NEW.status <> 'live' THEN
    NEW.status := 'live';
    NEW.live_at := COALESCE(NEW.live_at, now());
  END IF;

  RETURN NEW;
END;
$$;

-- Backfill deadline for already-paired duos that don't have one
UPDATE public.collab_slots
SET submit_deadline_at = COALESCE(paired_at, now()) + interval '3 hours'
WHERE partner_id IS NOT NULL
  AND submit_deadline_at IS NULL
  AND status IN ('paired', 'editing');

-- Auto-expire helper: any paired/editing duo past deadline becomes 'expired'
CREATE OR REPLACE FUNCTION public.expire_overdue_collab_slots()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.collab_slots
  SET status = 'expired'
  WHERE status IN ('paired', 'editing')
    AND submit_deadline_at IS NOT NULL
    AND submit_deadline_at < now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Schedule expirer every 5 minutes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('expire-overdue-collabs') WHERE TRUE;
    PERFORM cron.schedule(
      'expire-overdue-collabs',
      '*/5 * * * *',
      $cron$ SELECT public.expire_overdue_collab_slots(); $cron$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;