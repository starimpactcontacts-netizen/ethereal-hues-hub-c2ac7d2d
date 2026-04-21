-- Add inspo edit video and upvote fields to competitions
ALTER TABLE public.competitions
  ADD COLUMN IF NOT EXISTS inspo_video_url TEXT,
  ADD COLUMN IF NOT EXISTS inspo_video_platform TEXT,
  ADD COLUMN IF NOT EXISTS inspo_thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS upvote_count INTEGER NOT NULL DEFAULT 0;

-- Upvotes table
CREATE TABLE IF NOT EXISTS public.competition_upvotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (competition_id, user_id)
);

ALTER TABLE public.competition_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view upvotes"
  ON public.competition_upvotes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can upvote"
  ON public.competition_upvotes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own upvote"
  ON public.competition_upvotes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Sync trigger for upvote_count
CREATE OR REPLACE FUNCTION public.sync_competition_upvote_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  comp_id UUID;
BEGIN
  comp_id := COALESCE(NEW.competition_id, OLD.competition_id);
  UPDATE public.competitions
  SET upvote_count = (SELECT COUNT(*) FROM public.competition_upvotes WHERE competition_id = comp_id)
  WHERE id = comp_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_competition_upvote_count ON public.competition_upvotes;
CREATE TRIGGER trg_sync_competition_upvote_count
AFTER INSERT OR DELETE ON public.competition_upvotes
FOR EACH ROW EXECUTE FUNCTION public.sync_competition_upvote_count();