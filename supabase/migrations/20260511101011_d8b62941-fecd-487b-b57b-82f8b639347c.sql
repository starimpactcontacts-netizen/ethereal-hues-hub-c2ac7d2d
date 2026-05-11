ALTER TABLE public.collab_slots
ADD COLUMN IF NOT EXISTS challenges_slot_id uuid REFERENCES public.collab_slots(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_collab_slots_challenges_slot_id
ON public.collab_slots(challenges_slot_id);