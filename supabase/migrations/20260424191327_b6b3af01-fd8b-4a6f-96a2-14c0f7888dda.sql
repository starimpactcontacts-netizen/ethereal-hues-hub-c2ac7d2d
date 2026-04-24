-- Add base payout requirements + manual approval rate to missions
ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS approval_rate_pct integer,
  ADD COLUMN IF NOT EXISTS base_payout_requirements text;

-- Per-user / per-mission base-payout eligibility requests
CREATE TABLE IF NOT EXISTS public.mission_base_eligibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  username text,
  avatar_url text,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  admin_notes text,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mission_id, user_id)
);

ALTER TABLE public.mission_base_eligibility ENABLE ROW LEVEL SECURITY;

-- A user sees their own request
CREATE POLICY "Users view own eligibility"
ON public.mission_base_eligibility FOR SELECT
USING (auth.uid() = user_id);

-- Admin/dev see all
CREATE POLICY "Admins view all eligibility"
ON public.mission_base_eligibility FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'dev'::app_role));

-- A user can request (insert) for themselves
CREATE POLICY "Users request eligibility"
ON public.mission_base_eligibility FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admin/dev can update (approve/reject)
CREATE POLICY "Admins update eligibility"
ON public.mission_base_eligibility FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'dev'::app_role));

CREATE TRIGGER trg_mission_base_eligibility_updated
BEFORE UPDATE ON public.mission_base_eligibility
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_mission_base_eligibility_user ON public.mission_base_eligibility(user_id);
CREATE INDEX IF NOT EXISTS idx_mission_base_eligibility_mission ON public.mission_base_eligibility(mission_id, status);