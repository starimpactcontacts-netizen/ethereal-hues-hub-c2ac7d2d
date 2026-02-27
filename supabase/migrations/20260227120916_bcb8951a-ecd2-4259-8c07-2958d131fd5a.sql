
-- Queue table for overflow submissions when a round is full
CREATE TABLE public.featured_drop_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  drop_id UUID NOT NULL REFERENCES public.featured_drops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  submission_url TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'tiktok',
  thumbnail_url TEXT,
  video_title TEXT,
  author_username TEXT,
  embed_html TEXT,
  queue_position INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'queued', -- queued, promoted, rejected
  promoted_to_round_id UUID REFERENCES public.featured_drop_rounds(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(drop_id, user_id) -- one queue entry per user per drop
);

-- Enable RLS
ALTER TABLE public.featured_drop_queue ENABLE ROW LEVEL SECURITY;

-- Anyone can read the queue
CREATE POLICY "Anyone can view queue" ON public.featured_drop_queue
  FOR SELECT USING (true);

-- Authenticated users can insert their own entry
CREATE POLICY "Users can submit to queue" ON public.featured_drop_queue
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only admins/devs can update (promote/reject)
CREATE POLICY "Admins can manage queue" ON public.featured_drop_queue
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

CREATE POLICY "Admins can delete queue" ON public.featured_drop_queue
  FOR DELETE USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

-- Auto-assign queue position
CREATE OR REPLACE FUNCTION public.set_queue_position()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_pos INTEGER;
BEGIN
  SELECT COALESCE(MAX(queue_position), 0) + 1 INTO next_pos
  FROM public.featured_drop_queue
  WHERE drop_id = NEW.drop_id;
  
  NEW.queue_position := next_pos;
  
  -- Enforce max 100 queue entries per drop
  IF next_pos > 100 THEN
    RAISE EXCEPTION 'Queue is full (max 100)';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_queue_position_trigger
  BEFORE INSERT ON public.featured_drop_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.set_queue_position();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.featured_drop_queue;
