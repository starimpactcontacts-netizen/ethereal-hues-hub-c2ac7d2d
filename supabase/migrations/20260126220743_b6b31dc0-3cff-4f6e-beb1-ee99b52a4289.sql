-- Create a trigger function to log crew chat activity
CREATE OR REPLACE FUNCTION public.log_crew_chat_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert activity for chat message
  INSERT INTO public.crew_activity (
    crew_id,
    user_id,
    activity_type,
    title,
    description,
    data
  ) VALUES (
    NEW.crew_id,
    NEW.user_id,
    'chat_message',
    NEW.username || ' sent a message',
    CASE 
      WHEN NEW.message_text LIKE 'https://media.tenor.com%' OR NEW.message_text LIKE 'https://media.giphy.com%' THEN 'Sent a GIF'
      WHEN LENGTH(NEW.message_text) > 50 THEN SUBSTRING(NEW.message_text, 1, 47) || '...'
      ELSE NEW.message_text
    END,
    jsonb_build_object('message_id', NEW.id)
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on crew_messages
DROP TRIGGER IF EXISTS on_crew_message_insert ON public.crew_messages;
CREATE TRIGGER on_crew_message_insert
  AFTER INSERT ON public.crew_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.log_crew_chat_activity();

-- Also add trigger for when users join a crew
CREATE OR REPLACE FUNCTION public.log_crew_member_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  member_username TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get the username
    SELECT username INTO member_username FROM public.profiles WHERE id = NEW.user_id;
    
    -- Log the join activity
    INSERT INTO public.crew_activity (
      crew_id,
      user_id,
      activity_type,
      title,
      description,
      data
    ) VALUES (
      NEW.crew_id,
      NEW.user_id,
      'join',
      COALESCE(member_username, 'Someone') || ' joined the crew',
      'Welcome to the squad!',
      jsonb_build_object('role', NEW.role)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on crew_members for join activity
DROP TRIGGER IF EXISTS on_crew_member_join ON public.crew_members;
CREATE TRIGGER on_crew_member_join
  AFTER INSERT ON public.crew_members
  FOR EACH ROW
  EXECUTE FUNCTION public.log_crew_member_activity();