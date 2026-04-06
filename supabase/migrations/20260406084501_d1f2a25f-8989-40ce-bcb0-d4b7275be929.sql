
CREATE TABLE public.mission_lobby_presence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  drop_id UUID NOT NULL,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (drop_id, user_id)
);

ALTER TABLE public.mission_lobby_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lobby presence"
  ON public.mission_lobby_presence FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can upsert their own presence"
  ON public.mission_lobby_presence FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own presence"
  ON public.mission_lobby_presence FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_mission_lobby_drop ON public.mission_lobby_presence(drop_id, last_seen_at DESC);
