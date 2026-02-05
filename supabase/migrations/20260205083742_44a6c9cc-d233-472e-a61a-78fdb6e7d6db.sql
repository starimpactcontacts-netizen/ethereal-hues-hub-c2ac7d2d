-- Create trigger function to notify on new connection request
CREATE OR REPLACE FUNCTION public.notify_connection_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  sender_username TEXT;
  sender_avatar TEXT;
BEGIN
  -- Only notify on new pending connections
  IF NEW.status = 'pending' THEN
    -- Get sender info
    SELECT username, avatar_url INTO sender_username, sender_avatar
    FROM public.profiles WHERE id = NEW.sender_id;
    
    -- Create notification for receiver
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.receiver_id,
      'connection_request',
      'New Connection Request',
      '@' || COALESCE(sender_username, 'Someone') || ' wants to connect with you',
      jsonb_build_object(
        'sender_id', NEW.sender_id,
        'sender_username', sender_username,
        'sender_avatar', sender_avatar,
        'connection_id', NEW.id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_connection_request_created ON public.connections;
CREATE TRIGGER on_connection_request_created
  AFTER INSERT ON public.connections
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_connection_request();

-- Create trigger function to notify when connection is accepted
CREATE OR REPLACE FUNCTION public.notify_connection_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  accepter_username TEXT;
  accepter_avatar TEXT;
BEGIN
  -- Only notify when status changes to accepted
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
    -- Get accepter (receiver) info
    SELECT username, avatar_url INTO accepter_username, accepter_avatar
    FROM public.profiles WHERE id = NEW.receiver_id;
    
    -- Create notification for original sender
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

-- Create the trigger for acceptance
DROP TRIGGER IF EXISTS on_connection_accepted ON public.connections;
CREATE TRIGGER on_connection_accepted
  AFTER UPDATE ON public.connections
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_connection_accepted();