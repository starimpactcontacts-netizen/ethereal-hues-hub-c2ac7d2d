
-- Voting window columns
ALTER TABLE public.competitions
  ADD COLUMN IF NOT EXISTS voting_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS voting_deadline TIMESTAMPTZ;

-- Vote count cache on submissions
ALTER TABLE public.competition_submissions
  ADD COLUMN IF NOT EXISTS vote_count INTEGER NOT NULL DEFAULT 0;

-- Votes table
CREATE TABLE IF NOT EXISTS public.competition_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES public.competition_submissions(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(competition_id, voter_id)
);

ALTER TABLE public.competition_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view competition votes" ON public.competition_votes;
CREATE POLICY "Anyone can view competition votes"
  ON public.competition_votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users cast their own vote" ON public.competition_votes;
CREATE POLICY "Users cast their own vote"
  ON public.competition_votes FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = voter_id
    AND NOT EXISTS (
      SELECT 1 FROM public.competition_submissions s
      WHERE s.id = submission_id AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users remove their own vote" ON public.competition_votes;
CREATE POLICY "Users remove their own vote"
  ON public.competition_votes FOR DELETE TO authenticated
  USING (auth.uid() = voter_id);

-- Sync vote counts onto submissions
CREATE OR REPLACE FUNCTION public.sync_competition_submission_votes()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  sub_id UUID;
BEGIN
  sub_id := COALESCE(NEW.submission_id, OLD.submission_id);
  UPDATE public.competition_submissions
    SET vote_count = (SELECT COUNT(*) FROM public.competition_votes WHERE submission_id = sub_id)
    WHERE id = sub_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_competition_submission_votes ON public.competition_votes;
CREATE TRIGGER trg_sync_competition_submission_votes
  AFTER INSERT OR DELETE ON public.competition_votes
  FOR EACH ROW EXECUTE FUNCTION public.sync_competition_submission_votes();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.competition_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.competition_submissions;
