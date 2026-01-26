-- Conversations table to track message threads between users
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1_id UUID NOT NULL,
  participant_2_id UUID NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_message_preview TEXT,
  unread_count_1 INTEGER NOT NULL DEFAULT 0,
  unread_count_2 INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(participant_1_id, participant_2_id)
);

-- Direct messages table
CREATE TABLE public.direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message_text TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Policies for conversations
CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT
USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

CREATE POLICY "Users can update their conversations"
ON public.conversations FOR UPDATE
USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

-- Policies for direct messages
CREATE POLICY "Users can view messages in their conversations"
ON public.direct_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = direct_messages.conversation_id
    AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages in their conversations"
ON public.direct_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = direct_messages.conversation_id
    AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
  )
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- Helper function to get or create conversation (always stores smaller UUID first for consistency)
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(p_user_1 UUID, p_user_2 UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  conv_id UUID;
  sorted_user_1 UUID;
  sorted_user_2 UUID;
BEGIN
  -- Always store in consistent order (smaller UUID first)
  IF p_user_1 < p_user_2 THEN
    sorted_user_1 := p_user_1;
    sorted_user_2 := p_user_2;
  ELSE
    sorted_user_1 := p_user_2;
    sorted_user_2 := p_user_1;
  END IF;

  -- Try to find existing
  SELECT id INTO conv_id
  FROM public.conversations
  WHERE participant_1_id = sorted_user_1 AND participant_2_id = sorted_user_2;

  -- Create if not exists
  IF conv_id IS NULL THEN
    INSERT INTO public.conversations (participant_1_id, participant_2_id)
    VALUES (sorted_user_1, sorted_user_2)
    RETURNING id INTO conv_id;
  END IF;

  RETURN conv_id;
END;
$$;

-- Trigger to update conversation when message is sent
CREATE OR REPLACE FUNCTION public.update_conversation_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  conv RECORD;
BEGIN
  -- Get conversation details
  SELECT * INTO conv FROM public.conversations WHERE id = NEW.conversation_id;
  
  -- Update conversation with latest message info and increment unread for recipient
  UPDATE public.conversations
  SET 
    last_message_at = NEW.created_at,
    last_message_preview = CASE 
      WHEN NEW.message_text LIKE 'https://media.tenor.com%' THEN 'Sent a GIF'
      WHEN LENGTH(NEW.message_text) > 50 THEN SUBSTRING(NEW.message_text, 1, 47) || '...'
      ELSE NEW.message_text
    END,
    unread_count_1 = CASE WHEN conv.participant_1_id = NEW.sender_id THEN 0 ELSE unread_count_1 + 1 END,
    unread_count_2 = CASE WHEN conv.participant_2_id = NEW.sender_id THEN 0 ELSE unread_count_2 + 1 END,
    updated_at = now()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_direct_message_sent
AFTER INSERT ON public.direct_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_on_message();

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION public.mark_conversation_read(p_conversation_id UUID, p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  conv RECORD;
BEGIN
  SELECT * INTO conv FROM public.conversations WHERE id = p_conversation_id;
  
  IF conv IS NULL THEN
    RETURN;
  END IF;
  
  -- Update unread count for the user
  IF conv.participant_1_id = p_user_id THEN
    UPDATE public.conversations SET unread_count_1 = 0 WHERE id = p_conversation_id;
  ELSIF conv.participant_2_id = p_user_id THEN
    UPDATE public.conversations SET unread_count_2 = 0 WHERE id = p_conversation_id;
  END IF;
  
  -- Mark messages as read
  UPDATE public.direct_messages
  SET read_at = now()
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND read_at IS NULL;
END;
$$;