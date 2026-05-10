
CREATE TABLE public.collab_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_id UUID NOT NULL REFERENCES public.collab_slots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT,
  avatar_url TEXT,
  body TEXT NOT NULL CHECK (length(body) > 0 AND length(body) <= 500),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_collab_messages_slot ON public.collab_messages(slot_id, created_at);

ALTER TABLE public.collab_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read collab messages"
ON public.collab_messages FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can post their own messages"
ON public.collab_messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
ON public.collab_messages FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.collab_messages;
ALTER TABLE public.collab_messages REPLICA IDENTITY FULL;
