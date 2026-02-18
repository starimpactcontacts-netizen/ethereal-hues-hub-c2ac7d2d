
-- Add vote counters to featured_submissions
ALTER TABLE public.featured_submissions
ADD COLUMN IF NOT EXISTS upvotes integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS downvotes integer NOT NULL DEFAULT 0;

-- Create votes table
CREATE TABLE public.featured_submission_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id uuid NOT NULL REFERENCES public.featured_submissions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (submission_id, user_id)
);

-- Enable RLS
ALTER TABLE public.featured_submission_votes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view votes"
ON public.featured_submission_votes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote"
ON public.featured_submission_votes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vote"
ON public.featured_submission_votes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vote"
ON public.featured_submission_votes FOR DELETE
USING (auth.uid() = user_id);

-- Trigger to sync vote counts
CREATE OR REPLACE FUNCTION public.sync_featured_submission_votes()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  target_id uuid;
BEGIN
  target_id := COALESCE(NEW.submission_id, OLD.submission_id);
  
  UPDATE public.featured_submissions
  SET upvotes = (SELECT COUNT(*) FROM public.featured_submission_votes WHERE submission_id = target_id AND vote_type = 'up'),
      downvotes = (SELECT COUNT(*) FROM public.featured_submission_votes WHERE submission_id = target_id AND vote_type = 'down')
  WHERE id = target_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER sync_featured_votes
AFTER INSERT OR UPDATE OR DELETE ON public.featured_submission_votes
FOR EACH ROW EXECUTE FUNCTION public.sync_featured_submission_votes();

-- Enable realtime for votes
ALTER PUBLICATION supabase_realtime ADD TABLE public.featured_submission_votes;
