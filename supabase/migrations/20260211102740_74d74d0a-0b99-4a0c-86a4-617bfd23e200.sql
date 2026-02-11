
-- Add judge selection fields to battles
ALTER TABLE public.battles 
ADD COLUMN IF NOT EXISTS requested_judge_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS requested_judge_username TEXT,
ADD COLUMN IF NOT EXISTS judge_status TEXT DEFAULT 'none' CHECK (judge_status IN ('none', 'requested', 'accepted', 'declined')),
ADD COLUMN IF NOT EXISTS submission_mode TEXT DEFAULT 'create' CHECK (submission_mode IN ('create', 'reuse')),
ADD COLUMN IF NOT EXISTS is_rapid BOOLEAN DEFAULT false;

-- Battle chat messages (dual: private fighter chat + public spectator thread)
CREATE TABLE public.battle_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID NOT NULL REFERENCES public.battles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  message_text TEXT NOT NULL,
  is_public BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.battle_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can read public messages
CREATE POLICY "Anyone can read public battle messages"
ON public.battle_messages FOR SELECT
USING (is_public = true);

-- Battle participants can read private messages
CREATE POLICY "Fighters and judge can read private messages"
ON public.battle_messages FOR SELECT
USING (
  is_public = false AND (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.battles b
      WHERE b.id = battle_id
      AND (b.challenger_id = auth.uid() OR b.opponent_id = auth.uid() OR b.judge_id = auth.uid())
    )
  )
);

-- Authenticated users can send public messages
CREATE POLICY "Authenticated users can send public messages"
ON public.battle_messages FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND is_public = true
);

-- Only fighters and judge can send private messages
CREATE POLICY "Fighters and judge can send private messages"
ON public.battle_messages FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND is_public = false AND
  EXISTS (
    SELECT 1 FROM public.battles b
    WHERE b.id = battle_id
    AND (b.challenger_id = auth.uid() OR b.opponent_id = auth.uid() OR b.judge_id = auth.uid())
  )
);

-- Users can delete their own messages
CREATE POLICY "Users can delete own battle messages"
ON public.battle_messages FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_messages;

-- Apply profanity filter
CREATE TRIGGER filter_battle_message_profanity
BEFORE INSERT OR UPDATE ON public.battle_messages
FOR EACH ROW EXECUTE FUNCTION public.filter_message_profanity();
