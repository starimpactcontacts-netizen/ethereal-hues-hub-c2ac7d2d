
-- ═══ FEATURED DROP ROUNDS ═══
CREATE TABLE public.featured_drop_rounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  drop_id UUID NOT NULL REFERENCES public.featured_drops(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL DEFAULT 1,
  max_submissions INTEGER NOT NULL DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, open, full, judging, completed
  judge_id UUID,
  judge_username TEXT,
  judge_avatar_url TEXT,
  judge_video_url TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(drop_id, round_number)
);

ALTER TABLE public.featured_drop_rounds ENABLE ROW LEVEL SECURITY;

-- Anyone can view rounds
CREATE POLICY "Anyone can view rounds"
  ON public.featured_drop_rounds FOR SELECT USING (true);

-- Admins/devs can insert/update/delete
CREATE POLICY "Admins manage rounds"
  ON public.featured_drop_rounds FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

CREATE POLICY "Admins update rounds"
  ON public.featured_drop_rounds FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

CREATE POLICY "Admins delete rounds"
  ON public.featured_drop_rounds FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

-- Judges can update their own round (to submit video + rankings)
CREATE POLICY "Judge can update own round"
  ON public.featured_drop_rounds FOR UPDATE
  TO authenticated
  USING (judge_id = auth.uid());

-- ═══ ADD round_id TO featured_submissions ═══
ALTER TABLE public.featured_submissions ADD COLUMN round_id UUID REFERENCES public.featured_drop_rounds(id);

-- ═══ FEATURED ROUND RANKINGS ═══
CREATE TABLE public.featured_round_rankings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  round_id UUID NOT NULL REFERENCES public.featured_drop_rounds(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES public.featured_submissions(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  index_awarded INTEGER NOT NULL DEFAULT 0,
  xp_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(round_id, submission_id),
  UNIQUE(round_id, rank)
);

ALTER TABLE public.featured_round_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view rankings"
  ON public.featured_round_rankings FOR SELECT USING (true);

CREATE POLICY "Admins manage rankings"
  ON public.featured_round_rankings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

CREATE POLICY "Admins update rankings"
  ON public.featured_round_rankings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

CREATE POLICY "Admins delete rankings"
  ON public.featured_round_rankings FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

-- Judge assigned to the round can also manage rankings
CREATE POLICY "Judge can insert rankings"
  ON public.featured_round_rankings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.featured_drop_rounds
      WHERE id = round_id AND judge_id = auth.uid()
    )
  );

CREATE POLICY "Judge can update rankings"
  ON public.featured_round_rankings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.featured_drop_rounds
      WHERE id = round_id AND judge_id = auth.uid()
    )
  );

-- ═══ AUTO-UPDATE round status when submissions fill ═══
CREATE OR REPLACE FUNCTION public.check_round_slot_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_count INTEGER;
  max_subs INTEGER;
  round_status TEXT;
BEGIN
  IF NEW.round_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT status, max_submissions INTO round_status, max_subs
  FROM public.featured_drop_rounds WHERE id = NEW.round_id;

  IF round_status != 'open' THEN
    RAISE EXCEPTION 'This round is not accepting submissions';
  END IF;

  SELECT COUNT(*) INTO current_count
  FROM public.featured_submissions WHERE round_id = NEW.round_id;

  -- current_count is BEFORE this insert
  IF current_count >= max_subs THEN
    RAISE EXCEPTION 'Round is full — no more submission slots';
  END IF;

  -- If this insert fills it, mark as full
  IF current_count + 1 >= max_subs THEN
    UPDATE public.featured_drop_rounds SET status = 'full' WHERE id = NEW.round_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_round_slots
  BEFORE INSERT ON public.featured_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_round_slot_limit();

-- ═══ ENABLE REALTIME ═══
ALTER PUBLICATION supabase_realtime ADD TABLE public.featured_drop_rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.featured_round_rankings;
