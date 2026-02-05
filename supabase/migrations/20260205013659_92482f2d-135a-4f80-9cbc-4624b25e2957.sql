-- Create feed_comments table for TikTok-style comments on submissions
CREATE TABLE public.feed_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Link to submission (composite key approach)
  submission_id TEXT NOT NULL, -- Format: "arena_{id}" or "review_{id}"
  submission_type TEXT NOT NULL CHECK (submission_type IN ('arena', 'review')),
  
  -- Comment content
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  
  -- Reply support (single-level)
  parent_id UUID REFERENCES public.feed_comments(id) ON DELETE CASCADE,
  
  -- Engagement
  like_count INT NOT NULL DEFAULT 0,
  reply_count INT NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create feed_comment_likes table for tracking who liked what
CREATE TABLE public.feed_comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.feed_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_feed_comments_submission ON public.feed_comments(submission_id, submission_type);
CREATE INDEX idx_feed_comments_parent ON public.feed_comments(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_feed_comments_user ON public.feed_comments(user_id);
CREATE INDEX idx_feed_comment_likes_comment ON public.feed_comment_likes(comment_id);
CREATE INDEX idx_feed_comment_likes_user ON public.feed_comment_likes(user_id);

-- Enable RLS
ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feed_comments
CREATE POLICY "Comments are viewable by everyone" 
ON public.feed_comments FOR SELECT USING (true);

CREATE POLICY "Users can create their own comments" 
ON public.feed_comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON public.feed_comments FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.feed_comments FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for feed_comment_likes
CREATE POLICY "Comment likes are viewable by everyone" 
ON public.feed_comment_likes FOR SELECT USING (true);

CREATE POLICY "Users can create their own likes" 
ON public.feed_comment_likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" 
ON public.feed_comment_likes FOR DELETE 
USING (auth.uid() = user_id);

-- Function to increment like count
CREATE OR REPLACE FUNCTION public.handle_feed_comment_like()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feed_comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feed_comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.comment_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for like count updates
CREATE TRIGGER on_feed_comment_like
AFTER INSERT OR DELETE ON public.feed_comment_likes
FOR EACH ROW EXECUTE FUNCTION public.handle_feed_comment_like();

-- Function to increment reply count on parent
CREATE OR REPLACE FUNCTION public.handle_feed_comment_reply()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    UPDATE public.feed_comments SET reply_count = reply_count + 1 WHERE id = NEW.parent_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
    UPDATE public.feed_comments SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = OLD.parent_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for reply count updates
CREATE TRIGGER on_feed_comment_reply
AFTER INSERT OR DELETE ON public.feed_comments
FOR EACH ROW EXECUTE FUNCTION public.handle_feed_comment_reply();

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_comments;