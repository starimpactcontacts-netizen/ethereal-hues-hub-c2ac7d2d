
-- Create enum for event modes
CREATE TYPE public.event_mode AS ENUM ('standard', 'open_arena');

-- Create enum for round types
CREATE TYPE public.round_type AS ENUM ('open', 'elimination', 'threshold');

-- Create enum for advancement types
CREATE TYPE public.advancement_type AS ENUM ('top_x', 'percentage', 'manual', 'none');

-- Create enum for winner logic
CREATE TYPE public.winner_logic AS ENUM ('final_qoi', 'cumulative_qoi', 'manual');

-- Create enum for round status
CREATE TYPE public.round_status AS ENUM ('pending', 'active', 'completed');

-- Create enum for participant round status
CREATE TYPE public.participant_status AS ENUM ('active', 'advanced', 'eliminated', 'pending');

-- Add new columns to events table for Open Arena support
ALTER TABLE public.events
ADD COLUMN event_mode public.event_mode DEFAULT 'standard',
ADD COLUMN total_rounds INTEGER DEFAULT 1,
ADD COLUMN max_editors INTEGER DEFAULT NULL,
ADD COLUMN winner_logic public.winner_logic DEFAULT 'final_qoi',
ADD COLUMN show_eliminated BOOLEAN DEFAULT true,
ADD COLUMN hide_future_rounds BOOLEAN DEFAULT false;

-- Create event_rounds table for per-round configuration
CREATE TABLE public.event_rounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL CHECK (round_number BETWEEN 1 AND 3),
  round_type public.round_type NOT NULL DEFAULT 'open',
  advancement_type public.advancement_type NOT NULL DEFAULT 'none',
  advancement_value INTEGER DEFAULT NULL,
  threshold_qoi NUMERIC DEFAULT NULL,
  max_submissions INTEGER DEFAULT 1,
  index_reward INTEGER DEFAULT 0,
  bonus_multiplier NUMERIC DEFAULT 1.0,
  duration_hours INTEGER DEFAULT 24,
  auto_start_next BOOLEAN DEFAULT false,
  show_leaderboard BOOLEAN DEFAULT true,
  status public.round_status DEFAULT 'pending',
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(event_id, round_number)
);

-- Create round_participations table for tracking user status per round
CREATE TABLE public.round_participations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL CHECK (round_number BETWEEN 1 AND 3),
  status public.participant_status DEFAULT 'pending',
  submission_url TEXT,
  platform public.platform_type,
  qoi_score NUMERIC DEFAULT NULL,
  quality_score NUMERIC DEFAULT NULL,
  originality_score NUMERIC DEFAULT NULL,
  impact_score NUMERIC DEFAULT NULL,
  cumulative_qoi NUMERIC DEFAULT 0,
  submitted_at TIMESTAMP WITH TIME ZONE,
  judged_at TIMESTAMP WITH TIME ZONE,
  judge_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, event_id, round_number)
);

-- Enable RLS
ALTER TABLE public.event_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_participations ENABLE ROW LEVEL SECURITY;

-- RLS policies for event_rounds
CREATE POLICY "Anyone can view event rounds"
ON public.event_rounds FOR SELECT
USING (true);

CREATE POLICY "Admins can manage event rounds"
ON public.event_rounds FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for round_participations
CREATE POLICY "Anyone can view round participations"
ON public.round_participations FOR SELECT
USING (true);

CREATE POLICY "Users can submit to rounds"
ON public.round_participations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage round participations"
ON public.round_participations FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update round participations"
ON public.round_participations FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to advance users to next round
CREATE OR REPLACE FUNCTION public.advance_round_participants(
  p_event_id UUID,
  p_round_number INTEGER,
  p_advancement_type public.advancement_type,
  p_advancement_value INTEGER DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  advanced_count INTEGER := 0;
  threshold_val NUMERIC;
BEGIN
  -- Get threshold if it's a threshold round
  SELECT threshold_qoi INTO threshold_val
  FROM public.event_rounds
  WHERE event_id = p_event_id AND round_number = p_round_number;

  IF p_advancement_type = 'top_x' THEN
    -- Advance top X by QOI score
    WITH ranked AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY qoi_score DESC NULLS LAST) as rank
      FROM public.round_participations
      WHERE event_id = p_event_id AND round_number = p_round_number AND status = 'active'
    )
    UPDATE public.round_participations rp
    SET status = CASE 
      WHEN r.rank <= p_advancement_value THEN 'advanced'::participant_status 
      ELSE 'eliminated'::participant_status 
    END
    FROM ranked r
    WHERE rp.id = r.id;
    
    GET DIAGNOSTICS advanced_count = ROW_COUNT;
    
  ELSIF p_advancement_type = 'percentage' THEN
    -- Advance top X%
    WITH ranked AS (
      SELECT id, 
             ROW_NUMBER() OVER (ORDER BY qoi_score DESC NULLS LAST) as rank,
             COUNT(*) OVER () as total
      FROM public.round_participations
      WHERE event_id = p_event_id AND round_number = p_round_number AND status = 'active'
    )
    UPDATE public.round_participations rp
    SET status = CASE 
      WHEN r.rank <= CEIL(r.total * p_advancement_value / 100.0) THEN 'advanced'::participant_status 
      ELSE 'eliminated'::participant_status 
    END
    FROM ranked r
    WHERE rp.id = r.id;
    
    GET DIAGNOSTICS advanced_count = ROW_COUNT;
    
  ELSIF p_advancement_type = 'none' THEN
    -- Open round - everyone advances
    UPDATE public.round_participations
    SET status = 'advanced'
    WHERE event_id = p_event_id AND round_number = p_round_number AND status = 'active';
    
    GET DIAGNOSTICS advanced_count = ROW_COUNT;
  END IF;

  -- Create entries for next round for advanced users
  IF p_round_number < 3 THEN
    INSERT INTO public.round_participations (user_id, event_id, round_number, status, cumulative_qoi)
    SELECT user_id, event_id, p_round_number + 1, 'pending', 
           COALESCE(cumulative_qoi, 0) + COALESCE(qoi_score, 0)
    FROM public.round_participations
    WHERE event_id = p_event_id AND round_number = p_round_number AND status = 'advanced'
    ON CONFLICT (user_id, event_id, round_number) DO NOTHING;
  END IF;

  RETURN advanced_count;
END;
$$;

-- Function to start a round
CREATE OR REPLACE FUNCTION public.start_event_round(p_event_id UUID, p_round_number INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  round_duration INTEGER;
BEGIN
  -- Get round duration
  SELECT duration_hours INTO round_duration
  FROM public.event_rounds
  WHERE event_id = p_event_id AND round_number = p_round_number;

  -- Update round status
  UPDATE public.event_rounds
  SET status = 'active',
      starts_at = now(),
      ends_at = now() + (round_duration || ' hours')::INTERVAL
  WHERE event_id = p_event_id AND round_number = p_round_number;

  -- For round 1, create participation entries for all eligible users
  IF p_round_number = 1 THEN
    -- This will be handled by user submissions
    NULL;
  END IF;

  RETURN true;
END;
$$;

-- Function to end a round and process advancement
CREATE OR REPLACE FUNCTION public.end_event_round(p_event_id UUID, p_round_number INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  round_record RECORD;
  advanced INTEGER;
BEGIN
  -- Get round config
  SELECT * INTO round_record
  FROM public.event_rounds
  WHERE event_id = p_event_id AND round_number = p_round_number;

  -- Mark round as completed
  UPDATE public.event_rounds
  SET status = 'completed', ends_at = now()
  WHERE event_id = p_event_id AND round_number = p_round_number;

  -- Process advancement
  advanced := public.advance_round_participants(
    p_event_id,
    p_round_number,
    round_record.advancement_type,
    round_record.advancement_value
  );

  -- Auto-start next round if enabled
  IF round_record.auto_start_next AND p_round_number < 3 THEN
    PERFORM public.start_event_round(p_event_id, p_round_number + 1);
  END IF;

  RETURN advanced;
END;
$$;

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.round_participations;
