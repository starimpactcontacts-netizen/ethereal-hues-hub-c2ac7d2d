
-- ═══════════════════════════════════════════════════════════════
-- QUICK FIGHTS: Lightweight 1v1 instant battle system
-- ═══════════════════════════════════════════════════════════════

-- Quick fights table - minimal fields, max speed
CREATE TABLE public.quick_fights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Players (RED = player_1, BLUE = player_2)
  player_1_id UUID NOT NULL REFERENCES auth.users(id),
  player_1_username TEXT NOT NULL,
  player_1_avatar_url TEXT,
  player_2_id UUID REFERENCES auth.users(id),
  player_2_username TEXT,
  player_2_avatar_url TEXT,
  
  -- State
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'submitted', 'judging', 'completed', 'forfeited')),
  
  -- Submissions (TikTok/YouTube/CapCut links)
  player_1_submission_url TEXT,
  player_1_submitted_at TIMESTAMPTZ,
  player_2_submission_url TEXT,
  player_2_submitted_at TIMESTAMPTZ,
  
  -- Judging
  judge_id UUID REFERENCES auth.users(id),
  judge_username TEXT,
  winner_id UUID REFERENCES auth.users(id),
  winner_score INTEGER,
  loser_score INTEGER,
  judge_notes TEXT,
  judged_at TIMESTAMPTZ,
  
  -- Timing (3 hour max)
  duration_minutes INTEGER NOT NULL DEFAULT 180,
  matched_at TIMESTAMPTZ,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  
  -- Engagement
  view_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quick fight messages (red vs blue chat + auto-text)
CREATE TABLE public.quick_fight_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fight_id UUID NOT NULL REFERENCES public.quick_fights(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  message_text TEXT NOT NULL,
  is_auto_text BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quick fight queue (for instant matchmaking)
CREATE TABLE public.quick_fight_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '5 minutes')
);

-- Quick fight votes (community voting)
CREATE TABLE public.quick_fight_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fight_id UUID NOT NULL REFERENCES public.quick_fights(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  voted_for UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(fight_id, user_id)
);

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.quick_fights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_fight_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_fight_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_fight_votes ENABLE ROW LEVEL SECURITY;

-- Quick fights: everyone can read, participants can update
CREATE POLICY "Anyone can view quick fights" ON public.quick_fights FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create quick fights" ON public.quick_fights FOR INSERT TO authenticated WITH CHECK (auth.uid() = player_1_id);
CREATE POLICY "Participants can update their fight" ON public.quick_fights FOR UPDATE TO authenticated USING (auth.uid() IN (player_1_id, player_2_id, judge_id));

-- Messages: everyone can read, authenticated can send
CREATE POLICY "Anyone can view fight messages" ON public.quick_fight_messages FOR SELECT USING (true);
CREATE POLICY "Authenticated can send messages" ON public.quick_fight_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Queue: users manage their own queue entry
CREATE POLICY "Users can view queue" ON public.quick_fight_queue FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join queue" ON public.quick_fight_queue FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave queue" ON public.quick_fight_queue FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Votes: anyone can see, authenticated can vote
CREATE POLICY "Anyone can view votes" ON public.quick_fight_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated can vote" ON public.quick_fight_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- REALTIME
-- ═══════════════════════════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE public.quick_fights;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quick_fight_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quick_fight_queue;

-- ═══════════════════════════════════════════════════════════════
-- MATCHMAKING FUNCTION
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.quick_fight_match(p_user_id UUID, p_username TEXT, p_avatar_url TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  matched RECORD;
  new_fight_id UUID;
  starts TIMESTAMPTZ := now();
BEGIN
  -- Look for someone in queue (not self, not expired)
  SELECT * INTO matched
  FROM public.quick_fight_queue
  WHERE user_id != p_user_id
    AND expires_at > now()
  ORDER BY queued_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF matched IS NULL THEN
    -- No match: join queue
    INSERT INTO public.quick_fight_queue (user_id, username, avatar_url)
    VALUES (p_user_id, p_username, p_avatar_url)
    ON CONFLICT (user_id) DO UPDATE 
    SET username = p_username, avatar_url = p_avatar_url, queued_at = now(), expires_at = now() + INTERVAL '5 minutes';
    RETURN NULL;
  END IF;

  -- Match found! Create the fight
  INSERT INTO public.quick_fights (
    player_1_id, player_1_username, player_1_avatar_url,
    player_2_id, player_2_username, player_2_avatar_url,
    status, matched_at, starts_at, ends_at, duration_minutes
  ) VALUES (
    matched.user_id, matched.username, matched.avatar_url,
    p_user_id, p_username, p_avatar_url,
    'active', starts, starts, starts + INTERVAL '3 hours', 180
  )
  RETURNING id INTO new_fight_id;

  -- Remove both from queue
  DELETE FROM public.quick_fight_queue WHERE user_id IN (p_user_id, matched.user_id);

  -- System message
  INSERT INTO public.quick_fight_messages (fight_id, user_id, username, message_text, is_system)
  VALUES (new_fight_id, '00000000-0000-0000-0000-000000000000'::uuid, 'System', '⚔️ FIGHT STARTED! You have 3 hours to submit your edit.', true);

  -- Notifications
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES 
    (matched.user_id, 'quick_fight', '⚔️ Quick Fight!', 'You''ve been matched vs @' || p_username || '!', jsonb_build_object('fight_id', new_fight_id)),
    (p_user_id, 'quick_fight', '⚔️ Quick Fight!', 'You''ve been matched vs @' || matched.username || '!', jsonb_build_object('fight_id', new_fight_id));

  RETURN new_fight_id;
END;
$$;

-- ═══════════════════════════════════════════════════════════════
-- AUTO FORFEIT: Check if time expired + only one submitted
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.quick_fight_submit(p_fight_id UUID, p_user_id UUID, p_url TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fight RECORD;
BEGIN
  SELECT * INTO fight FROM public.quick_fights WHERE id = p_fight_id;
  IF fight IS NULL OR fight.status != 'active' THEN RETURN false; END IF;

  -- Update submission
  IF p_user_id = fight.player_1_id THEN
    UPDATE public.quick_fights SET player_1_submission_url = p_url, player_1_submitted_at = now() WHERE id = p_fight_id;
  ELSIF p_user_id = fight.player_2_id THEN
    UPDATE public.quick_fights SET player_2_submission_url = p_url, player_2_submitted_at = now() WHERE id = p_fight_id;
  ELSE
    RETURN false;
  END IF;

  -- Re-fetch to check both
  SELECT * INTO fight FROM public.quick_fights WHERE id = p_fight_id;
  IF fight.player_1_submitted_at IS NOT NULL AND fight.player_2_submitted_at IS NOT NULL THEN
    UPDATE public.quick_fights SET status = 'judging' WHERE id = p_fight_id;
    -- System message
    INSERT INTO public.quick_fight_messages (fight_id, user_id, username, message_text, is_system)
    VALUES (p_fight_id, '00000000-0000-0000-0000-000000000000'::uuid, 'System', '🔥 Both edits submitted! Waiting for a judge...', true);
  END IF;

  RETURN true;
END;
$$;

-- Profanity filter for quick fight messages
CREATE TRIGGER filter_quick_fight_message_profanity
  BEFORE INSERT ON public.quick_fight_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.filter_message_profanity();

-- Index for fast lookups
CREATE INDEX idx_quick_fights_status ON public.quick_fights(status);
CREATE INDEX idx_quick_fights_players ON public.quick_fights(player_1_id, player_2_id);
CREATE INDEX idx_quick_fight_messages_fight ON public.quick_fight_messages(fight_id);
CREATE INDEX idx_quick_fight_queue_expires ON public.quick_fight_queue(expires_at);
