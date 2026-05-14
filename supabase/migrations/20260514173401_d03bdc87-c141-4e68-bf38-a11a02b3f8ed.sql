
-- event_messages
CREATE TABLE public.event_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL,
  user_id uuid NOT NULL,
  username text NOT NULL,
  avatar_url text,
  message_text text,
  message_type text NOT NULL DEFAULT 'text', -- text | gif | sticker
  media_url text,
  reply_to_id uuid REFERENCES public.event_messages(id) ON DELETE SET NULL,
  reply_to_username text,
  reply_to_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_event_messages_event ON public.event_messages(event_id, created_at);

ALTER TABLE public.event_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view event messages"
  ON public.event_messages FOR SELECT USING (true);

CREATE POLICY "Auth users can post event messages"
  ON public.event_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own event messages"
  ON public.event_messages FOR DELETE USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.event_messages;

-- event_chat_reads
CREATE TABLE public.event_chat_reads (
  user_id uuid NOT NULL,
  event_id text NOT NULL,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event_id)
);

ALTER TABLE public.event_chat_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own read marks"
  ON public.event_chat_reads FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert their own read marks"
  ON public.event_chat_reads FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update their own read marks"
  ON public.event_chat_reads FOR UPDATE USING (auth.uid() = user_id);
