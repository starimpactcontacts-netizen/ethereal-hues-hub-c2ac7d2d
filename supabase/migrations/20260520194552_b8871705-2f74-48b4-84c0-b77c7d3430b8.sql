ALTER TABLE public.event_participations DROP CONSTRAINT IF EXISTS event_participations_user_id_event_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS event_participations_user_event_unique_non_showcase
  ON public.event_participations (user_id, event_id)
  WHERE is_showcase = false;