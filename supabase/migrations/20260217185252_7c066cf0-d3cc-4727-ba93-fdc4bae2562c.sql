
-- Live chat for featured drops
CREATE TABLE public.featured_drop_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  drop_id UUID NOT NULL REFERENCES public.featured_drops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  message_text TEXT NOT NULL,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_featured_drop_messages_drop ON public.featured_drop_messages(drop_id, created_at DESC);

-- RLS
ALTER TABLE public.featured_drop_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read drop messages"
  ON public.featured_drop_messages FOR SELECT USING (true);

CREATE POLICY "Authenticated users can send drop messages"
  ON public.featured_drop_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own drop messages"
  ON public.featured_drop_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.featured_drop_messages;

-- Profanity filter
CREATE TRIGGER filter_featured_drop_message_profanity
  BEFORE INSERT OR UPDATE ON public.featured_drop_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.filter_message_profanity();
