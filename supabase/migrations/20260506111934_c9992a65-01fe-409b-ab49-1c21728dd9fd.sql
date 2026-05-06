CREATE TABLE public.mission_global_chat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  username text NOT NULL,
  avatar_url text,
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 280),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_mission_global_chat_created ON public.mission_global_chat(created_at DESC);

ALTER TABLE public.mission_global_chat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read mission chat"
  ON public.mission_global_chat FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can post own messages"
  ON public.mission_global_chat FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
  ON public.mission_global_chat FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.mission_global_chat;
ALTER TABLE public.mission_global_chat REPLICA IDENTITY FULL;