CREATE OR REPLACE FUNCTION public.notify_on_feed_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  post_owner_id UUID;
  commenter_username TEXT;
  commenter_avatar TEXT;
BEGIN
  -- Only notify for comments on feed posts
  IF NEW.submission_type IS DISTINCT FROM 'feed_post' THEN
    RETURN NEW;
  END IF;

  -- Get feed post owner using submission_id
  SELECT user_id INTO post_owner_id
  FROM public.feed_posts
  WHERE id::text = NEW.submission_id;

  -- Skip if post not found or user is commenting on their own post
  IF post_owner_id IS NULL OR post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Get commenter info
  SELECT username, avatar_url INTO commenter_username, commenter_avatar
  FROM public.profiles
  WHERE id = NEW.user_id;

  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    post_owner_id,
    'post_commented',
    '💬 ' || COALESCE(commenter_username, 'Someone') || ' commented on your loop',
    SUBSTRING(NEW.content, 1, 60),
    jsonb_build_object(
      'commenter_id', NEW.user_id,
      'commenter_username', commenter_username,
      'commenter_avatar', commenter_avatar,
      'post_id', NEW.submission_id,
      'comment_id', NEW.id
    )
  );

  RETURN NEW;
END;
$function$;