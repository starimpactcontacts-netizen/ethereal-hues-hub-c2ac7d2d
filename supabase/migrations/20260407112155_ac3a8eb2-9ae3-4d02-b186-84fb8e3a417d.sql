
-- Cash battle messages for live chat
CREATE TABLE public.cash_battle_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  battle_id UUID NOT NULL REFERENCES public.cash_battles(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  message_text TEXT NOT NULL,
  is_system BOOLEAN DEFAULT false,
  reply_to_id UUID REFERENCES public.cash_battle_messages(id),
  reply_to_username TEXT,
  reply_to_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cash_battle_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cash battle messages"
ON public.cash_battle_messages FOR SELECT USING (true);

CREATE POLICY "Authenticated users can post cash battle messages"
ON public.cash_battle_messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.cash_battle_messages;

-- Add thumbnail columns to cash_battles
ALTER TABLE public.cash_battles
ADD COLUMN IF NOT EXISTS challenger_thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS opponent_thumbnail_url TEXT;
