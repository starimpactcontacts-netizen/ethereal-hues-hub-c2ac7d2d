
-- Storage bucket for loop media uploads (images, videos, GIFs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('loop-media', 'loop-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to loop-media
CREATE POLICY "Users can upload loop media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'loop-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Anyone can view loop media (public bucket)
CREATE POLICY "Loop media is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'loop-media');

-- Users can delete their own loop media
CREATE POLICY "Users can delete own loop media"
ON storage.objects FOR DELETE
USING (bucket_id = 'loop-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add uploaded media columns to feed_posts
ALTER TABLE public.feed_posts 
ADD COLUMN IF NOT EXISTS uploaded_media_url text,
ADD COLUMN IF NOT EXISTS uploaded_media_type text;

-- Emoji reactions table for loops
CREATE TABLE public.feed_post_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, emoji)
);

ALTER TABLE public.feed_post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reactions"
ON public.feed_post_reactions FOR SELECT
USING (true);

CREATE POLICY "Users can add reactions"
ON public.feed_post_reactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions"
ON public.feed_post_reactions FOR DELETE
USING (auth.uid() = user_id);

-- Index for fast reaction lookups
CREATE INDEX idx_feed_post_reactions_post_id ON public.feed_post_reactions(post_id);
CREATE INDEX idx_feed_post_reactions_user ON public.feed_post_reactions(user_id);

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_post_reactions;
