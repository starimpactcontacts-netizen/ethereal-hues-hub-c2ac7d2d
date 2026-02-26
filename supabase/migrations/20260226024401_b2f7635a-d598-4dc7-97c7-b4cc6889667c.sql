
-- Feed posts table (Twitter-style short posts)
CREATE TABLE public.feed_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) <= 280),
  post_type TEXT NOT NULL DEFAULT 'text' CHECK (post_type IN ('text', 'flex', 'edit_share', 'milestone')),
  media_url TEXT,
  media_platform TEXT,
  submission_id UUID,
  like_count INTEGER NOT NULL DEFAULT 0,
  bookmark_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  share_count INTEGER NOT NULL DEFAULT 0,
  is_system BOOLEAN NOT NULL DEFAULT false,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Feed post likes
CREATE TABLE public.feed_post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Feed post bookmarks
CREATE TABLE public.feed_post_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Indexes
CREATE INDEX idx_feed_posts_user_id ON public.feed_posts(user_id);
CREATE INDEX idx_feed_posts_created_at ON public.feed_posts(created_at DESC);
CREATE INDEX idx_feed_posts_post_type ON public.feed_posts(post_type);
CREATE INDEX idx_feed_post_likes_post_id ON public.feed_post_likes(post_id);
CREATE INDEX idx_feed_post_likes_user_id ON public.feed_post_likes(user_id);
CREATE INDEX idx_feed_post_bookmarks_user_id ON public.feed_post_bookmarks(user_id);

-- Enable RLS
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_post_bookmarks ENABLE ROW LEVEL SECURITY;

-- Feed posts policies
CREATE POLICY "Anyone can view feed posts" ON public.feed_posts FOR SELECT USING (true);
CREATE POLICY "Users can create their own posts" ON public.feed_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.feed_posts FOR DELETE USING (auth.uid() = user_id);

-- Feed post likes policies
CREATE POLICY "Anyone can view likes" ON public.feed_post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON public.feed_post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON public.feed_post_likes FOR DELETE USING (auth.uid() = user_id);

-- Feed post bookmarks policies
CREATE POLICY "Anyone can view own bookmarks" ON public.feed_post_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can bookmark posts" ON public.feed_post_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unbookmark posts" ON public.feed_post_bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Trigger: sync like count
CREATE OR REPLACE FUNCTION public.sync_feed_post_like_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feed_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feed_posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER on_feed_post_like
AFTER INSERT OR DELETE ON public.feed_post_likes
FOR EACH ROW EXECUTE FUNCTION public.sync_feed_post_like_count();

-- Trigger: sync bookmark count
CREATE OR REPLACE FUNCTION public.sync_feed_post_bookmark_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feed_posts SET bookmark_count = bookmark_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feed_posts SET bookmark_count = GREATEST(bookmark_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER on_feed_post_bookmark
AFTER INSERT OR DELETE ON public.feed_post_bookmarks
FOR EACH ROW EXECUTE FUNCTION public.sync_feed_post_bookmark_count();

-- Trigger: create notification on like
CREATE OR REPLACE FUNCTION public.notify_feed_post_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  post_owner UUID;
  liker_username TEXT;
  liker_avatar TEXT;
  post_preview TEXT;
BEGIN
  SELECT user_id, LEFT(content, 50) INTO post_owner, post_preview FROM feed_posts WHERE id = NEW.post_id;
  IF post_owner = NEW.user_id THEN RETURN NEW; END IF;
  SELECT username, avatar_url INTO liker_username, liker_avatar FROM profiles WHERE id = NEW.user_id;
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (post_owner, 'post_liked', 'Someone liked your post', '@' || COALESCE(liker_username, 'Someone') || ' liked: "' || COALESCE(post_preview, '') || '..."',
    jsonb_build_object('post_id', NEW.post_id, 'liker_id', NEW.user_id, 'liker_username', liker_username));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_feed_post_like_notify
AFTER INSERT ON public.feed_post_likes
FOR EACH ROW EXECUTE FUNCTION public.notify_feed_post_like();

-- Enable realtime for feed_posts
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_posts;
