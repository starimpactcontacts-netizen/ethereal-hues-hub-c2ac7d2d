
-- ═══════════════════════════════════════════════════════════
-- MISSIONS — standalone paid clipper missions
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  sponsor_name TEXT,
  sponsor_logo_url TEXT,
  reference_video_url TEXT,
  scenepack_url TEXT,
  -- Payout config
  base_payout_cents INTEGER NOT NULL DEFAULT 0,
  -- view_milestones is an array of objects: [{"views": 10000, "bonus_cents": 1000}, ...]
  view_milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
  budget_cents INTEGER NOT NULL DEFAULT 0,
  spent_cents INTEGER NOT NULL DEFAULT 0,
  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'draft', -- draft, live, paused, closed
  deadline TIMESTAMPTZ,
  -- Stats
  submission_count INTEGER NOT NULL DEFAULT 0,
  approved_count INTEGER NOT NULL DEFAULT 0,
  total_views INTEGER NOT NULL DEFAULT 0,
  -- Admin
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_missions_status ON public.missions(status);
CREATE INDEX idx_missions_created_at ON public.missions(created_at DESC);

ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

-- Public can view live/paused missions
CREATE POLICY "Anyone can view live missions"
  ON public.missions FOR SELECT
  USING (status IN ('live', 'paused', 'closed'));

-- Staff can do everything
CREATE POLICY "Staff can view all missions"
  ON public.missions FOR SELECT
  USING (has_role(auth.uid(), 'dev') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can insert missions"
  ON public.missions FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'dev') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can update missions"
  ON public.missions FOR UPDATE
  USING (has_role(auth.uid(), 'dev') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can delete missions"
  ON public.missions FOR DELETE
  USING (has_role(auth.uid(), 'dev') OR has_role(auth.uid(), 'admin'));

-- ═══════════════════════════════════════════════════════════
-- MISSION SUBMISSIONS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.mission_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT,
  avatar_url TEXT,
  -- Submission data
  video_url TEXT NOT NULL,
  platform TEXT,
  thumbnail_url TEXT,
  title TEXT,
  posted_handle TEXT,
  -- Performance
  view_count INTEGER NOT NULL DEFAULT 0,
  like_count INTEGER NOT NULL DEFAULT 0,
  -- Earnings
  base_earned_cents INTEGER NOT NULL DEFAULT 0,
  bonus_earned_cents INTEGER NOT NULL DEFAULT 0,
  total_earned_cents INTEGER NOT NULL DEFAULT 0,
  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, paid
  feedback TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mission_subs_mission ON public.mission_submissions(mission_id);
CREATE INDEX idx_mission_subs_user ON public.mission_submissions(user_id);
CREATE INDEX idx_mission_subs_status ON public.mission_submissions(status);

ALTER TABLE public.mission_submissions ENABLE ROW LEVEL SECURITY;

-- Users can see their own
CREATE POLICY "Users can view own submissions"
  ON public.mission_submissions FOR SELECT
  USING (auth.uid() = user_id);

-- Staff can see all
CREATE POLICY "Staff can view all submissions"
  ON public.mission_submissions FOR SELECT
  USING (has_role(auth.uid(), 'dev') OR has_role(auth.uid(), 'admin'));

-- Users can submit
CREATE POLICY "Users can insert own submissions"
  ON public.mission_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update certain fields on their own (e.g. add view_count)
CREATE POLICY "Users can update own submissions"
  ON public.mission_submissions FOR UPDATE
  USING (auth.uid() = user_id);

-- Staff can update any (for review)
CREATE POLICY "Staff can update any submission"
  ON public.mission_submissions FOR UPDATE
  USING (has_role(auth.uid(), 'dev') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can delete submissions"
  ON public.mission_submissions FOR DELETE
  USING (has_role(auth.uid(), 'dev') OR has_role(auth.uid(), 'admin'));

-- Auto-compute total_earned_cents
CREATE OR REPLACE FUNCTION public.sync_mission_submission_total()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.total_earned_cents := COALESCE(NEW.base_earned_cents, 0) + COALESCE(NEW.bonus_earned_cents, 0);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_mission_submission_total
  BEFORE INSERT OR UPDATE ON public.mission_submissions
  FOR EACH ROW EXECUTE FUNCTION public.sync_mission_submission_total();

-- ═══════════════════════════════════════════════════════════
-- MISSION PAYOUTS (instant withdrawals, no minimum)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.mission_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  method TEXT NOT NULL, -- paypal, bank, crypto
  destination TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, paid, rejected
  admin_notes TEXT,
  processed_by UUID,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mission_payouts_user ON public.mission_payouts(user_id);
CREATE INDEX idx_mission_payouts_status ON public.mission_payouts(status);

ALTER TABLE public.mission_payouts ENABLE ROW LEVEL SECURITY;

-- Users see their own payouts
CREATE POLICY "Users can view own payouts"
  ON public.mission_payouts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can request payouts
CREATE POLICY "Users can insert own payouts"
  ON public.mission_payouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Staff see all
CREATE POLICY "Staff can view all payouts"
  ON public.mission_payouts FOR SELECT
  USING (has_role(auth.uid(), 'dev') OR has_role(auth.uid(), 'admin'));

-- Staff process payouts
CREATE POLICY "Staff can update payouts"
  ON public.mission_payouts FOR UPDATE
  USING (has_role(auth.uid(), 'dev') OR has_role(auth.uid(), 'admin'));

-- Updated_at triggers
CREATE TRIGGER trg_missions_updated_at
  BEFORE UPDATE ON public.missions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_mission_payouts_updated_at
  BEFORE UPDATE ON public.mission_payouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
