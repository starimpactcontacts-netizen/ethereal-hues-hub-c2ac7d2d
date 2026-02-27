
-- 1. New table: solo_submission_votes
CREATE TABLE public.solo_submission_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES public.solo_submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (submission_id, user_id)
);

-- 2. New columns on solo_submissions
ALTER TABLE public.solo_submissions
  ADD COLUMN IF NOT EXISTS upvotes INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS downvotes INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comment_count INTEGER NOT NULL DEFAULT 0;

-- 3. RLS on solo_submission_votes
ALTER TABLE public.solo_submission_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read solo votes"
  ON public.solo_submission_votes FOR SELECT
  USING (true);

CREATE POLICY "Auth users can insert own votes"
  ON public.solo_submission_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Auth users can delete own votes"
  ON public.solo_submission_votes FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Trigger to sync vote counts
CREATE OR REPLACE FUNCTION public.sync_solo_submission_votes()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  target_id uuid;
BEGIN
  target_id := COALESCE(NEW.submission_id, OLD.submission_id);
  
  UPDATE public.solo_submissions
  SET upvotes = (SELECT COUNT(*) FROM public.solo_submission_votes WHERE submission_id = target_id AND vote_type = 'up'),
      downvotes = (SELECT COUNT(*) FROM public.solo_submission_votes WHERE submission_id = target_id AND vote_type = 'down')
  WHERE id = target_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER sync_solo_votes_on_change
  AFTER INSERT OR DELETE OR UPDATE ON public.solo_submission_votes
  FOR EACH ROW EXECUTE FUNCTION public.sync_solo_submission_votes();

-- 5. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.solo_submission_votes;

-- 6. Storage bucket for solo thumbnails
INSERT INTO storage.buckets (id, name, public) VALUES ('solo-thumbnails', 'solo-thumbnails', true);

CREATE POLICY "Anyone can view solo thumbnails"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'solo-thumbnails');

CREATE POLICY "Auth users can upload solo thumbnails"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'solo-thumbnails' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own solo thumbnails"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'solo-thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);
