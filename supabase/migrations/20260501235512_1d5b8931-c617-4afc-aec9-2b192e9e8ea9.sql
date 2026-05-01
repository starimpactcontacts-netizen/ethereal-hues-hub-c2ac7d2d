-- Public spectator chat for quick fights (separate from participant battle chat)
CREATE TABLE IF NOT EXISTS public.quick_fight_public_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fight_id UUID NOT NULL REFERENCES public.quick_fights(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qf_public_messages_fight ON public.quick_fight_public_messages(fight_id, created_at);

ALTER TABLE public.quick_fight_public_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read public quick fight messages"
ON public.quick_fight_public_messages
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can post public quick fight messages"
ON public.quick_fight_public_messages
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND length(message_text) BETWEEN 1 AND 500);

ALTER PUBLICATION supabase_realtime ADD TABLE public.quick_fight_public_messages;