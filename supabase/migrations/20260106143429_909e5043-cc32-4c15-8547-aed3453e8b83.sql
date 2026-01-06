-- Add XP and Level columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1;

-- Create XP history table
CREATE TABLE public.xp_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  xp_amount INTEGER NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on xp_history
ALTER TABLE public.xp_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own XP history
CREATE POLICY "Users can view their own XP history"
ON public.xp_history FOR SELECT
USING (auth.uid() = user_id);

-- System can insert XP history (via security definer functions)
CREATE POLICY "System can insert XP history"
ON public.xp_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create daily XP tracking table for caps
CREATE TABLE public.daily_xp_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(user_id, action_type, date)
);

-- Enable RLS
ALTER TABLE public.daily_xp_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their daily tracking"
ON public.daily_xp_tracking FOR ALL
USING (auth.uid() = user_id);

-- Create login streaks table
CREATE TABLE public.login_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  last_login_date DATE,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.login_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and manage their streak"
ON public.login_streaks FOR ALL
USING (auth.uid() = user_id);

-- Function to calculate level from XP
CREATE OR REPLACE FUNCTION public.calculate_level_from_xp(xp_amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  RETURN CASE
    WHEN xp_amount >= 7000 THEN 10
    WHEN xp_amount >= 4500 THEN 9
    WHEN xp_amount >= 3200 THEN 8
    WHEN xp_amount >= 2200 THEN 7
    WHEN xp_amount >= 1500 THEN 6
    WHEN xp_amount >= 1000 THEN 5
    WHEN xp_amount >= 600 THEN 4
    WHEN xp_amount >= 300 THEN 3
    WHEN xp_amount >= 100 THEN 2
    ELSE 1
  END;
END;
$$;

-- Trigger to auto-update level when XP changes
CREATE OR REPLACE FUNCTION public.update_level_on_xp_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.level := public.calculate_level_from_xp(NEW.xp);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_level
BEFORE INSERT OR UPDATE OF xp ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_level_on_xp_change();

-- Function to award XP with history tracking
CREATE OR REPLACE FUNCTION public.award_xp(
  p_user_id UUID,
  p_amount INTEGER,
  p_action TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS TABLE(new_xp INTEGER, new_level INTEGER, leveled_up BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_level INTEGER;
  updated_xp INTEGER;
  updated_level INTEGER;
BEGIN
  -- Get current level
  SELECT level INTO old_level FROM public.profiles WHERE id = p_user_id;
  
  -- Update XP
  UPDATE public.profiles 
  SET xp = xp + p_amount
  WHERE id = p_user_id
  RETURNING xp, level INTO updated_xp, updated_level;
  
  -- Record in history
  INSERT INTO public.xp_history (user_id, xp_amount, action, description)
  VALUES (p_user_id, p_amount, p_action, p_description);
  
  RETURN QUERY SELECT updated_xp, updated_level, (updated_level > old_level);
END;
$$;

-- Function to check and award daily capped XP (for chat messages)
CREATE OR REPLACE FUNCTION public.award_daily_capped_xp(
  p_user_id UUID,
  p_amount INTEGER,
  p_action_type TEXT,
  p_daily_cap INTEGER,
  p_description TEXT DEFAULT NULL
)
RETURNS TABLE(xp_awarded INTEGER, new_xp INTEGER, new_level INTEGER, leveled_up BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_daily_xp INTEGER;
  actual_award INTEGER;
  result RECORD;
BEGIN
  -- Get or create daily tracking
  INSERT INTO public.daily_xp_tracking (user_id, action_type, xp_earned, date)
  VALUES (p_user_id, p_action_type, 0, CURRENT_DATE)
  ON CONFLICT (user_id, action_type, date) DO NOTHING;
  
  -- Get current daily XP for this action
  SELECT xp_earned INTO current_daily_xp
  FROM public.daily_xp_tracking
  WHERE user_id = p_user_id AND action_type = p_action_type AND date = CURRENT_DATE;
  
  -- Calculate how much we can actually award
  actual_award := LEAST(p_amount, p_daily_cap - COALESCE(current_daily_xp, 0));
  
  IF actual_award <= 0 THEN
    -- Already at cap
    SELECT xp, level INTO result FROM public.profiles WHERE id = p_user_id;
    RETURN QUERY SELECT 0, result.xp, result.level, false;
    RETURN;
  END IF;
  
  -- Update daily tracking
  UPDATE public.daily_xp_tracking
  SET xp_earned = xp_earned + actual_award
  WHERE user_id = p_user_id AND action_type = p_action_type AND date = CURRENT_DATE;
  
  -- Award the XP
  SELECT * INTO result FROM public.award_xp(p_user_id, actual_award, p_action_type, p_description);
  
  RETURN QUERY SELECT actual_award, result.new_xp, result.new_level, result.leveled_up;
END;
$$;

-- Function to process login streak
CREATE OR REPLACE FUNCTION public.process_login_streak(p_user_id UUID)
RETURNS TABLE(streak_xp INTEGER, current_streak INTEGER, new_xp INTEGER, new_level INTEGER, leveled_up BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  streak_record RECORD;
  xp_to_award INTEGER := 0;
  result RECORD;
BEGIN
  -- Get or create streak record
  INSERT INTO public.login_streaks (user_id, current_streak, last_login_date)
  VALUES (p_user_id, 0, NULL)
  ON CONFLICT (user_id) DO NOTHING;
  
  SELECT * INTO streak_record FROM public.login_streaks WHERE user_id = p_user_id;
  
  -- Check if already logged in today
  IF streak_record.last_login_date = CURRENT_DATE THEN
    SELECT xp, level INTO result FROM public.profiles WHERE id = p_user_id;
    RETURN QUERY SELECT 0, streak_record.current_streak, result.xp, result.level, false;
    RETURN;
  END IF;
  
  -- Update streak
  IF streak_record.last_login_date = CURRENT_DATE - 1 THEN
    -- Consecutive day
    UPDATE public.login_streaks
    SET current_streak = current_streak + 1,
        last_login_date = CURRENT_DATE,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        updated_at = now()
    WHERE user_id = p_user_id;
  ELSE
    -- Streak broken, reset to 1
    UPDATE public.login_streaks
    SET current_streak = 1,
        last_login_date = CURRENT_DATE,
        updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
  
  -- Get updated streak
  SELECT * INTO streak_record FROM public.login_streaks WHERE user_id = p_user_id;
  
  -- Determine XP based on streak milestones
  xp_to_award := CASE
    WHEN streak_record.current_streak = 30 THEN 300
    WHEN streak_record.current_streak = 7 THEN 100
    WHEN streak_record.current_streak = 2 THEN 20
    WHEN streak_record.current_streak = 1 THEN 10
    ELSE 0
  END;
  
  IF xp_to_award > 0 THEN
    SELECT * INTO result FROM public.award_xp(p_user_id, xp_to_award, 'login_streak', 'Day ' || streak_record.current_streak || ' login streak');
    RETURN QUERY SELECT xp_to_award, streak_record.current_streak, result.new_xp, result.new_level, result.leveled_up;
  ELSE
    SELECT xp, level INTO result FROM public.profiles WHERE id = p_user_id;
    RETURN QUERY SELECT 0, streak_record.current_streak, result.xp, result.level, false;
  END IF;
END;
$$;

-- Create index for faster XP history queries
CREATE INDEX idx_xp_history_user_created ON public.xp_history(user_id, created_at DESC);