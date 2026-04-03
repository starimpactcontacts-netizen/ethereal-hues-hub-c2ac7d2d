
-- Add reply columns to featured_drop_messages
ALTER TABLE public.featured_drop_messages
  ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.featured_drop_messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reply_to_username text,
  ADD COLUMN IF NOT EXISTS reply_to_text text;

-- Add reply columns to battle_messages
ALTER TABLE public.battle_messages
  ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.battle_messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reply_to_username text,
  ADD COLUMN IF NOT EXISTS reply_to_text text;

-- Add reply columns to arena_messages
ALTER TABLE public.arena_messages
  ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.arena_messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reply_to_username text,
  ADD COLUMN IF NOT EXISTS reply_to_text text;

-- Function to extract @mentions from message text and create notifications
CREATE OR REPLACE FUNCTION public.notify_chat_mentions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mention text;
  mentioned_user_id uuid;
  chat_context text;
  notif_data jsonb;
BEGIN
  -- Extract @mentions from message_text
  FOR mention IN
    SELECT (regexp_matches(NEW.message_text, '@(\w+)', 'g'))[1]
  LOOP
    -- Look up user by username
    SELECT id INTO mentioned_user_id
    FROM public.profiles
    WHERE lower(username) = lower(mention)
    LIMIT 1;

    -- Don't notify yourself
    IF mentioned_user_id IS NOT NULL AND mentioned_user_id != NEW.user_id THEN
      -- Determine context
      chat_context := TG_TABLE_NAME;
      notif_data := jsonb_build_object(
        'chat_type', chat_context,
        'message_id', NEW.id,
        'sender_username', NEW.username
      );

      -- Add context-specific data
      IF TG_TABLE_NAME = 'featured_drop_messages' THEN
        notif_data := notif_data || jsonb_build_object('drop_id', NEW.drop_id);
      ELSIF TG_TABLE_NAME = 'battle_messages' THEN
        notif_data := notif_data || jsonb_build_object('battle_id', NEW.battle_id);
      ELSIF TG_TABLE_NAME = 'arena_messages' THEN
        notif_data := notif_data || jsonb_build_object('arena_id', NEW.arena_id);
      END IF;

      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (
        mentioned_user_id,
        'chat_mention',
        '💬 ' || NEW.username || ' mentioned you',
        substring(NEW.message_text from 1 for 100),
        notif_data
      );
    END IF;
  END LOOP;

  -- Also notify on replies
  IF NEW.reply_to_username IS NOT NULL THEN
    SELECT id INTO mentioned_user_id
    FROM public.profiles
    WHERE lower(username) = lower(NEW.reply_to_username)
    LIMIT 1;

    IF mentioned_user_id IS NOT NULL AND mentioned_user_id != NEW.user_id THEN
      chat_context := TG_TABLE_NAME;
      notif_data := jsonb_build_object(
        'chat_type', chat_context,
        'message_id', NEW.id,
        'sender_username', NEW.username
      );

      IF TG_TABLE_NAME = 'featured_drop_messages' THEN
        notif_data := notif_data || jsonb_build_object('drop_id', NEW.drop_id);
      ELSIF TG_TABLE_NAME = 'battle_messages' THEN
        notif_data := notif_data || jsonb_build_object('battle_id', NEW.battle_id);
      ELSIF TG_TABLE_NAME = 'arena_messages' THEN
        notif_data := notif_data || jsonb_build_object('arena_id', NEW.arena_id);
      END IF;

      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (
        mentioned_user_id,
        'chat_reply',
        '↩️ ' || NEW.username || ' replied to you',
        substring(NEW.message_text from 1 for 100),
        notif_data
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach triggers to all chat tables
CREATE TRIGGER notify_mentions_drop_chat
  AFTER INSERT ON public.featured_drop_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_chat_mentions();

CREATE TRIGGER notify_mentions_battle_chat
  AFTER INSERT ON public.battle_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_chat_mentions();

CREATE TRIGGER notify_mentions_arena_chat
  AFTER INSERT ON public.arena_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_chat_mentions();
