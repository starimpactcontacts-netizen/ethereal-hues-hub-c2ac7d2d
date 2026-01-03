-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  ip TEXT DEFAULT 'Film',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('live', 'pending', 'closed')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT DEFAULT 'Loopgate Arena',
  league TEXT NOT NULL DEFAULT 'open' CHECK (league IN ('open', 'elite', 'regional')),
  prize_pool TEXT,
  poster_url TEXT,
  rules TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Everyone can view events
CREATE POLICY "Anyone can view events" 
ON public.events 
FOR SELECT 
USING (true);

-- Only admins can manage events
CREATE POLICY "Admins can manage events" 
ON public.events 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Create active sessions table for tracking active users
CREATE TABLE public.active_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on active_sessions
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own sessions
CREATE POLICY "Users can manage their own sessions" 
ON public.active_sessions 
FOR ALL 
USING (auth.uid() = user_id);

-- Anyone can count active sessions (for stats)
CREATE POLICY "Anyone can view active sessions count" 
ON public.active_sessions 
FOR SELECT 
USING (true);

-- Create unique constraint for user sessions
CREATE UNIQUE INDEX active_sessions_user_id_idx ON public.active_sessions(user_id);

-- Function to update user's active session (upsert)
CREATE OR REPLACE FUNCTION public.update_active_session()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.active_sessions (user_id, last_seen)
  VALUES (auth.uid(), now())
  ON CONFLICT (user_id) 
  DO UPDATE SET last_seen = now();
END;
$$;

-- Function to calculate and update league based on ranking
CREATE OR REPLACE FUNCTION public.update_user_league()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_users INTEGER;
  user_rank INTEGER;
  percentile NUMERIC;
  new_league league_tier;
  has_win BOOLEAN;
BEGIN
  -- Count total users with index scores
  SELECT COUNT(*) INTO total_users 
  FROM public.profiles 
  WHERE global_index_score > 0;
  
  IF total_users = 0 THEN
    NEW.league := 'open';
    RETURN NEW;
  END IF;
  
  -- Get user's rank (1 = highest score)
  SELECT COUNT(*) + 1 INTO user_rank
  FROM public.profiles
  WHERE global_index_score > NEW.global_index_score;
  
  -- Calculate percentile (lower is better)
  percentile := (user_rank::NUMERIC / total_users) * 100;
  
  -- Check if user has any wins
  has_win := NEW.total_wins > 0;
  
  -- Determine league
  IF percentile <= 1 THEN
    new_league := 'elite';
  ELSIF percentile <= 15 AND has_win THEN
    new_league := 'pro';
  ELSE
    new_league := 'open';
  END IF;
  
  NEW.league := new_league;
  RETURN NEW;
END;
$$;

-- Trigger to auto-update league when index score changes
CREATE TRIGGER update_league_on_score_change
BEFORE UPDATE OF global_index_score, total_wins ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_user_league();

-- Function to recalculate index score from event participations
CREATE OR REPLACE FUNCTION public.recalculate_user_index(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avg_score NUMERIC;
  total_count INTEGER;
  win_count INTEGER;
  rate NUMERIC;
BEGIN
  -- Calculate average QOI score from judged participations
  SELECT AVG(qoi_score), COUNT(*)
  INTO avg_score, total_count
  FROM public.event_participations
  WHERE user_id = user_uuid 
    AND status = 'scored'
    AND qoi_score IS NOT NULL;
  
  -- Count wins (rank 1)
  SELECT COUNT(*)
  INTO win_count
  FROM public.event_participations
  WHERE user_id = user_uuid 
    AND final_rank = 1
    AND status = 'scored';
  
  -- Calculate win rate
  IF total_count > 0 THEN
    rate := (win_count::NUMERIC / total_count) * 100;
  ELSE
    rate := 0;
  END IF;
  
  -- Update profile
  UPDATE public.profiles
  SET 
    global_index_score = COALESCE(avg_score, 0),
    total_events = total_count,
    total_wins = win_count,
    win_rate = rate
  WHERE id = user_uuid;
END;
$$;

-- Trigger to update user index when participation is scored
CREATE OR REPLACE FUNCTION public.on_participation_scored()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Recalculate user's index when their submission is scored
  IF NEW.status = 'scored' AND (OLD.status IS NULL OR OLD.status != 'scored') THEN
    PERFORM public.recalculate_user_index(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER recalculate_index_on_score
AFTER UPDATE ON public.event_participations
FOR EACH ROW
EXECUTE FUNCTION public.on_participation_scored();

-- Enable realtime for rankings updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_participations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_sessions;

-- Add trigger for events updated_at
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();