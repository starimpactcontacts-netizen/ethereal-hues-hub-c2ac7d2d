-- ============================================================
-- COLLABS MODE
-- ============================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE public.collab_status AS ENUM (
    'open', 'paired', 'editing', 'pending_approval', 'live', 'rejected', 'expired'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.collab_invite_status AS ENUM ('pending', 'accepted', 'declined');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.collab_emoji AS ENUM ('fire', 'zap', 'diamond', 'crown', 'clapper');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- TABLE: collab_slots
-- ============================================================
CREATE TABLE IF NOT EXISTS public.collab_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  creator_username TEXT NOT NULL,
  creator_avatar_url TEXT,
  partner_id UUID,
  partner_username TEXT,
  partner_avatar_url TEXT,
  song_title TEXT NOT NULL,
  song_artist TEXT,
  song_url TEXT,
  total_duration_seconds INT NOT NULL DEFAULT 20,
  creator_segment TEXT NOT NULL,
  partner_segment TEXT NOT NULL,
  status public.collab_status NOT NULL DEFAULT 'open',
  final_video_url TEXT,
  uploaded_by UUID,
  creator_approved BOOLEAN NOT NULL DEFAULT FALSE,
  partner_approved BOOLEAN NOT NULL DEFAULT FALSE,
  reaction_score INT NOT NULL DEFAULT 0,
  total_reactions INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paired_at TIMESTAMPTZ,
  uploaded_at TIMESTAMPTZ,
  live_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days')
);

CREATE INDEX IF NOT EXISTS idx_collab_slots_status ON public.collab_slots(status);
CREATE INDEX IF NOT EXISTS idx_collab_slots_creator ON public.collab_slots(creator_id);
CREATE INDEX IF NOT EXISTS idx_collab_slots_partner ON public.collab_slots(partner_id);
CREATE INDEX IF NOT EXISTS idx_collab_slots_live_at ON public.collab_slots(live_at DESC) WHERE status = 'live';
CREATE INDEX IF NOT EXISTS idx_collab_slots_score ON public.collab_slots(reaction_score DESC) WHERE status = 'live';

ALTER TABLE public.collab_slots ENABLE ROW LEVEL SECURITY;

-- Public can read live + open
CREATE POLICY "Anyone can view live or open collabs"
  ON public.collab_slots FOR SELECT
  USING (status IN ('live', 'open'));

-- Editors can see their own slots in any state
CREATE POLICY "Editors can view their own collab slots"
  ON public.collab_slots FOR SELECT
  USING (auth.uid() = creator_id OR auth.uid() = partner_id);

-- Only auth users can create
CREATE POLICY "Authenticated users can create collab slots"
  ON public.collab_slots FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Either editor can update (joining, uploading, approving)
CREATE POLICY "Editors can update their collab slots"
  ON public.collab_slots FOR UPDATE
  USING (auth.uid() = creator_id OR auth.uid() = partner_id OR (status = 'open' AND auth.uid() IS NOT NULL))
  WITH CHECK (auth.uid() = creator_id OR auth.uid() = partner_id);

-- Creator can delete while open
CREATE POLICY "Creator can delete open slots"
  ON public.collab_slots FOR DELETE
  USING (auth.uid() = creator_id AND status = 'open');

-- ============================================================
-- TABLE: collab_invites
-- ============================================================
CREATE TABLE IF NOT EXISTS public.collab_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_id UUID NOT NULL REFERENCES public.collab_slots(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  status public.collab_invite_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  UNIQUE(slot_id, to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_collab_invites_to ON public.collab_invites(to_user_id, status);

ALTER TABLE public.collab_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inviter and invitee can view invites"
  ON public.collab_invites FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create invites they send"
  ON public.collab_invites FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Invitee can update invite status"
  ON public.collab_invites FOR UPDATE
  USING (auth.uid() = to_user_id);

-- ============================================================
-- TABLE: collab_reactions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.collab_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_id UUID NOT NULL REFERENCES public.collab_slots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji public.collab_emoji NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(slot_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_collab_reactions_slot ON public.collab_reactions(slot_id);

ALTER TABLE public.collab_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view collab reactions"
  ON public.collab_reactions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can react"
  ON public.collab_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions"
  ON public.collab_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- TABLE: collab_daily_winners
-- ============================================================
CREATE TABLE IF NOT EXISTS public.collab_daily_winners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  award_date DATE NOT NULL,
  place INT NOT NULL CHECK (place BETWEEN 1 AND 3),
  slot_id UUID NOT NULL REFERENCES public.collab_slots(id) ON DELETE CASCADE,
  xp_awarded INT NOT NULL DEFAULT 0,
  index_awarded INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(award_date, place)
);

CREATE INDEX IF NOT EXISTS idx_collab_winners_date ON public.collab_daily_winners(award_date DESC);

ALTER TABLE public.collab_daily_winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view daily winners"
  ON public.collab_daily_winners FOR SELECT
  USING (true);

-- ============================================================
-- TRIGGER: stamp lifecycle timestamps + flip status
-- ============================================================
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
    IF NEW.status = 'open' THEN
      NEW.status := 'paired';
    END IF;
  END IF;

  -- Just uploaded
  IF NEW.final_video_url IS NOT NULL AND (OLD.final_video_url IS NULL OR OLD.final_video_url <> NEW.final_video_url) THEN
    NEW.uploaded_at := now();
    -- reset approvals; the uploader auto-approves their own upload
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

DROP TRIGGER IF EXISTS trg_collab_slot_lifecycle ON public.collab_slots;
CREATE TRIGGER trg_collab_slot_lifecycle
  BEFORE UPDATE ON public.collab_slots
  FOR EACH ROW
  EXECUTE FUNCTION public.collab_slot_lifecycle();

-- ============================================================
-- TRIGGER: maintain reaction_score on collab_slots
-- emoji weights: fire=1, zap=1, diamond=2, crown=3, clapper=1
-- ============================================================
CREATE OR REPLACE FUNCTION public.collab_recompute_score(p_slot UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score INT;
  v_total INT;
BEGIN
  SELECT
    COALESCE(SUM(CASE emoji
      WHEN 'fire' THEN 1
      WHEN 'zap' THEN 1
      WHEN 'diamond' THEN 2
      WHEN 'crown' THEN 3
      WHEN 'clapper' THEN 1
    END), 0),
    COUNT(*)
  INTO v_score, v_total
  FROM public.collab_reactions
  WHERE slot_id = p_slot;

  UPDATE public.collab_slots
  SET reaction_score = v_score, total_reactions = v_total
  WHERE id = p_slot;
END;
$$;

CREATE OR REPLACE FUNCTION public.collab_reaction_changed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.collab_recompute_score(OLD.slot_id);
    RETURN OLD;
  ELSE
    PERFORM public.collab_recompute_score(NEW.slot_id);
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_collab_reaction_changed ON public.collab_reactions;
CREATE TRIGGER trg_collab_reaction_changed
  AFTER INSERT OR DELETE ON public.collab_reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.collab_reaction_changed();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.collab_slots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.collab_reactions;
