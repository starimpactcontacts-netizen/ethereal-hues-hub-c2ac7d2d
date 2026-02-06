
-- Fix: the connection accepted trigger was calling the notification function
-- but not the count-incrementing function. Replace with a combined function.

CREATE OR REPLACE FUNCTION public.handle_connection_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  accepter_username TEXT;
  accepter_avatar TEXT;
BEGIN
  -- When status changes to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
    -- Increment both users' connection counts
    UPDATE public.profiles 
    SET connection_count = (
      SELECT count(*) FROM public.connections 
      WHERE (sender_id = NEW.sender_id OR receiver_id = NEW.sender_id) AND status = 'accepted'
    )
    WHERE id = NEW.sender_id;

    UPDATE public.profiles 
    SET connection_count = (
      SELECT count(*) FROM public.connections 
      WHERE (sender_id = NEW.receiver_id OR receiver_id = NEW.receiver_id) AND status = 'accepted'
    )
    WHERE id = NEW.receiver_id;

    NEW.responded_at = now();

    -- Send notification
    SELECT username, avatar_url INTO accepter_username, accepter_avatar
    FROM public.profiles WHERE id = NEW.receiver_id;
    
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.sender_id,
      'connection_accepted',
      'Connection Accepted! 🎉',
      '@' || COALESCE(accepter_username, 'Someone') || ' accepted your connection request',
      jsonb_build_object(
        'user_id', NEW.receiver_id,
        'username', accepter_username,
        'avatar', accepter_avatar,
        'connection_id', NEW.id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Also fix the remove function to use accurate count
CREATE OR REPLACE FUNCTION public.handle_connection_removed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status = 'accepted' THEN
    UPDATE public.profiles 
    SET connection_count = (
      SELECT count(*) FROM public.connections 
      WHERE (sender_id = OLD.sender_id OR receiver_id = OLD.sender_id) AND status = 'accepted' AND id != OLD.id
    )
    WHERE id = OLD.sender_id;

    UPDATE public.profiles 
    SET connection_count = (
      SELECT count(*) FROM public.connections 
      WHERE (sender_id = OLD.receiver_id OR receiver_id = OLD.receiver_id) AND status = 'accepted' AND id != OLD.id
    )
    WHERE id = OLD.receiver_id;
  END IF;
  RETURN OLD;
END;
$$;

-- Replace the broken trigger with the combined one
DROP TRIGGER IF EXISTS on_connection_accepted ON public.connections;
CREATE TRIGGER on_connection_accepted 
  BEFORE UPDATE ON public.connections 
  FOR EACH ROW 
  EXECUTE FUNCTION handle_connection_status_change();

-- Sync all stale connection counts right now
UPDATE public.profiles p
SET connection_count = (
  SELECT count(*) FROM public.connections c
  WHERE (c.sender_id = p.id OR c.receiver_id = p.id) AND c.status = 'accepted'
);
