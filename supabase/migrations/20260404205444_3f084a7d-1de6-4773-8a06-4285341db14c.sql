
CREATE TABLE public.competition_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  message_text TEXT NOT NULL,
  is_system BOOLEAN DEFAULT false,
  reply_to_id UUID REFERENCES public.competition_messages(id),
  reply_to_username TEXT,
  reply_to_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_competition_messages_comp ON public.competition_messages(competition_id, created_at);

ALTER TABLE public.competition_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view competition messages"
  ON public.competition_messages FOR SELECT USING (true);

CREATE POLICY "Authenticated users can post messages"
  ON public.competition_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.competition_messages;
