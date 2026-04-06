
CREATE TABLE public.commission_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  commission_id UUID NOT NULL REFERENCES public.commissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  message_text TEXT NOT NULL,
  reply_to_id UUID REFERENCES public.commission_messages(id) ON DELETE SET NULL,
  reply_to_username TEXT,
  reply_to_text TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_commission_messages_commission_id ON public.commission_messages(commission_id);
CREATE INDEX idx_commission_messages_created_at ON public.commission_messages(created_at);

ALTER TABLE public.commission_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read commission messages"
  ON public.commission_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can post commission messages"
  ON public.commission_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own commission messages"
  ON public.commission_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.commission_messages;
