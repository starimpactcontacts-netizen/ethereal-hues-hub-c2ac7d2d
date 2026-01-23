-- Practice Matches table
CREATE TABLE public.practice_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Match type and timing
  match_type TEXT NOT NULL DEFAULT 'quick_spar', -- 'quick_spar' (30-90min) or 'extended' (up to 24h)
  duration_minutes INTEGER NOT NULL DEFAULT 60, -- actual duration chosen
  
  -- Participants
  player_1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  player_2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'queued', -- 'queued', 'matched', 'in_progress', 'submitted', 'judging', 'completed', 'voided'
  
  -- Submissions
  player_1_submission_url TEXT,
  player_1_platform TEXT,
  player_1_submitted_at TIMESTAMPTZ,
  player_2_submission_url TEXT,
  player_2_platform TEXT,
  player_2_submitted_at TIMESTAMPTZ,
  
  -- Judging
  judge_id UUID REFERENCES public.profiles(id),
  judge_claimed_at TIMESTAMPTZ,
  judge_auto_assigned BOOLEAN DEFAULT false,
  
  -- Scores (simple for practice - winner determination)
  player_1_score INTEGER,
  player_2_score INTEGER,
  winner_id UUID REFERENCES public.profiles(id),
  judge_notes TEXT,
  
  -- XP awarded
  winner_xp_awarded INTEGER DEFAULT 0,
  loser_xp_awarded INTEGER DEFAULT 0,
  compensation_xp_awarded INTEGER DEFAULT 0, -- for voided matches
  
  -- Timestamps
  matched_at TIMESTAMPTZ,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  judged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Practice Queue table (for matchmaking)
CREATE TABLE public.practice_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_type TEXT NOT NULL DEFAULT 'quick_spar',
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  skill_tier TEXT NOT NULL DEFAULT 'open', -- 'open', 'rising', 'established', 'elite' based on QOI
  queued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '15 minutes'),
  
  CONSTRAINT unique_user_in_queue UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.practice_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for practice_matches
CREATE POLICY "Anyone can view practice matches"
ON public.practice_matches FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create practice matches"
ON public.practice_matches FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Participants can update their submissions"
ON public.practice_matches FOR UPDATE
USING (
  auth.uid() = player_1_id OR 
  auth.uid() = player_2_id OR
  auth.uid() = judge_id OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'judge'::app_role)
);

-- RLS Policies for practice_queue
CREATE POLICY "Anyone can view queue"
ON public.practice_queue FOR SELECT
USING (true);

CREATE POLICY "Users can join queue"
ON public.practice_queue FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave queue"
ON public.practice_queue FOR DELETE
USING (auth.uid() = user_id);

-- Function to get skill tier from QOI score
CREATE OR REPLACE FUNCTION public.get_skill_tier(qoi_score NUMERIC)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN qoi_score >= 80 THEN 'elite'
    WHEN qoi_score >= 60 THEN 'established'
    WHEN qoi_score >= 40 THEN 'rising'
    ELSE 'open'
  END
$$;

-- Function to find and create a match from queue
CREATE OR REPLACE FUNCTION public.find_practice_match(p_user_id UUID, p_match_type TEXT, p_duration INTEGER)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_tier TEXT;
  matched_queue RECORD;
  new_match_id UUID;
BEGIN
  -- Get user's skill tier
  SELECT get_skill_tier(COALESCE(global_index_score, 0)) INTO user_tier
  FROM public.profiles WHERE id = p_user_id;
  
  -- Look for a match in queue (same tier, same type, not self)
  SELECT * INTO matched_queue
  FROM public.practice_queue
  WHERE user_id != p_user_id
    AND match_type = p_match_type
    AND skill_tier = user_tier
    AND expires_at > now()
  ORDER BY queued_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
  
  IF matched_queue IS NULL THEN
    -- No match found, add to queue
    INSERT INTO public.practice_queue (user_id, match_type, duration_minutes, skill_tier)
    VALUES (p_user_id, p_match_type, p_duration, user_tier)
    ON CONFLICT (user_id) DO UPDATE 
    SET match_type = p_match_type, 
        duration_minutes = p_duration,
        skill_tier = user_tier,
        queued_at = now(),
        expires_at = now() + INTERVAL '15 minutes';
    
    RETURN NULL;
  END IF;
  
  -- Match found! Create the practice match
  INSERT INTO public.practice_matches (
    match_type, 
    duration_minutes, 
    player_1_id, 
    player_2_id, 
    status,
    matched_at,
    starts_at,
    ends_at
  )
  VALUES (
    p_match_type,
    GREATEST(matched_queue.duration_minutes, p_duration),
    matched_queue.user_id,
    p_user_id,
    'matched',
    now(),
    now(),
    now() + (GREATEST(matched_queue.duration_minutes, p_duration) || ' minutes')::INTERVAL
  )
  RETURNING id INTO new_match_id;
  
  -- Remove both users from queue
  DELETE FROM public.practice_queue WHERE user_id IN (p_user_id, matched_queue.user_id);
  
  -- Create notifications for both players
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES 
    (matched_queue.user_id, 'practice_matched', 'Match Found!', 'You''ve been matched for a 1v1 Practice. Get ready!', 
     jsonb_build_object('match_id', new_match_id, 'match_type', p_match_type)),
    (p_user_id, 'practice_matched', 'Match Found!', 'You''ve been matched for a 1v1 Practice. Get ready!',
     jsonb_build_object('match_id', new_match_id, 'match_type', p_match_type));
  
  RETURN new_match_id;
END;
$$;

-- Function for judge to claim a match
CREATE OR REPLACE FUNCTION public.claim_practice_match(p_judge_id UUID, p_match_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is a judge
  IF NOT has_role(p_judge_id, 'judge'::app_role) THEN
    RETURN false;
  END IF;
  
  -- Try to claim (only if unclaimed and in 'submitted' status)
  UPDATE public.practice_matches
  SET judge_id = p_judge_id,
      judge_claimed_at = now(),
      status = 'judging',
      updated_at = now()
  WHERE id = p_match_id
    AND status = 'submitted'
    AND judge_id IS NULL;
  
  RETURN FOUND;
END;
$$;

-- Enable realtime for practice matches
ALTER PUBLICATION supabase_realtime ADD TABLE public.practice_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.practice_queue;