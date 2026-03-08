
-- Trigger: auto-create notification when someone likes a feed post
CREATE OR REPLACE FUNCTION public.notify_on_feed_post_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  post_owner_id UUID;
  liker_username TEXT;
  liker_avatar TEXT;
  post_preview TEXT;
BEGIN
  -- Get post owner
  SELECT user_id, SUBSTRING(content, 1, 50) INTO post_owner_id, post_preview
  FROM public.feed_posts WHERE id = NEW.post_id;
  
  -- Don't notify yourself
  IF post_owner_id = NEW.user_id THEN RETURN NEW; END IF;
  
  -- Get liker info
  SELECT username, avatar_url INTO liker_username, liker_avatar
  FROM public.profiles WHERE id = NEW.user_id;
  
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    post_owner_id,
    'post_liked',
    '❤️ ' || COALESCE(liker_username, 'Someone') || ' liked your loop',
    COALESCE(post_preview, 'your post'),
    jsonb_build_object('liker_id', NEW.user_id, 'liker_username', liker_username, 'liker_avatar', liker_avatar, 'post_id', NEW.post_id)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_feed_post_like
  AFTER INSERT ON public.feed_post_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_feed_post_like();

-- Trigger: auto-create notification when someone comments on a feed post
CREATE OR REPLACE FUNCTION public.notify_on_feed_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  post_owner_id UUID;
  commenter_username TEXT;
  commenter_avatar TEXT;
BEGIN
  -- Get post owner
  SELECT user_id INTO post_owner_id
  FROM public.feed_posts WHERE id = NEW.post_id;
  
  -- Don't notify yourself
  IF post_owner_id = NEW.user_id THEN RETURN NEW; END IF;
  
  -- Get commenter info
  SELECT username, avatar_url INTO commenter_username, commenter_avatar
  FROM public.profiles WHERE id = NEW.user_id;
  
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    post_owner_id,
    'post_commented',
    '💬 ' || COALESCE(commenter_username, 'Someone') || ' commented on your loop',
    SUBSTRING(NEW.content, 1, 60),
    jsonb_build_object('commenter_id', NEW.user_id, 'commenter_username', commenter_username, 'commenter_avatar', commenter_avatar, 'post_id', NEW.post_id, 'comment_id', NEW.id)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_feed_comment
  AFTER INSERT ON public.feed_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_feed_comment();

-- Trigger: auto-create notification when someone bookmarks/shares a feed post
CREATE OR REPLACE FUNCTION public.notify_on_feed_post_bookmark()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  post_owner_id UUID;
  bookmarker_username TEXT;
  bookmarker_avatar TEXT;
BEGIN
  SELECT user_id INTO post_owner_id
  FROM public.feed_posts WHERE id = NEW.post_id;
  
  IF post_owner_id = NEW.user_id THEN RETURN NEW; END IF;
  
  SELECT username, avatar_url INTO bookmarker_username, bookmarker_avatar
  FROM public.profiles WHERE id = NEW.user_id;
  
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    post_owner_id,
    'post_saved',
    '🔖 ' || COALESCE(bookmarker_username, 'Someone') || ' saved your loop',
    'Your post is getting traction',
    jsonb_build_object('user_id', NEW.user_id, 'username', bookmarker_username, 'avatar', bookmarker_avatar, 'post_id', NEW.post_id)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_feed_post_bookmark
  AFTER INSERT ON public.feed_post_bookmarks
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_feed_post_bookmark();
