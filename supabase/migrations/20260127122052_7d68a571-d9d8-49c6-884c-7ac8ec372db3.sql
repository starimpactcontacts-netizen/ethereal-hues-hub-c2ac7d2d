-- First drop any partially created objects
DROP TABLE IF EXISTS public.battle_views CASCADE;
DROP TABLE IF EXISTS public.battle_votes CASCADE;
DROP TABLE IF EXISTS public.battles CASCADE;

-- Create battles table for 1v1 UFC-style matchups
CREATE TABLE public.battles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  opponent_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenger_username text NOT NULL,
  opponent_username text,
  challenger_avatar_url text,
  opponent_avatar_url text,
  
  -- Battle config
  challenge_type text NOT NULL DEFAULT 'open' CHECK (challenge_type IN ('open', 'direct')),
  league_tier text NOT NULL DEFAULT 'open',
  duration_hours integer NOT NULL DEFAULT 48 CHECK (duration_hours IN (24, 48, 72)),
  
  -- Status tracking
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'active', 'judging', 'completed', 'cancelled', 'forfeited')),
  accepted_at timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  
  -- Submissions
  challenger_submission_url text,
  challenger_submission_platform text,
  challenger_submitted_at timestamptz,
  opponent_submission_url text,
  opponent_submission_platform text,
  opponent_submitted_at timestamptz,
  
  -- Judging (hybrid: judge score + community votes)
  judge_id uuid REFERENCES public.profiles(id),
  judge_claimed_at timestamptz,
  challenger_score numeric,
  opponent_score numeric,
  judge_notes text,
  judged_at timestamptz,
  
  -- Community voting
  challenger_votes integer NOT NULL DEFAULT 0,
  opponent_votes integer NOT NULL DEFAULT 0,
  
  -- View tracking (UFC style)
  view_count integer NOT NULL DEFAULT 0,
  
  -- Winner & rewards
  winner_id uuid REFERENCES public.profiles(id),
  winner_index_awarded integer DEFAULT 20,
  loser_index_penalty integer DEFAULT 5,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create battle votes table for community voting
CREATE TABLE public.battle_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id uuid NOT NULL REFERENCES public.battles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  voted_for uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(battle_id, user_id)
);

-- Create battle views table
CREATE TABLE public.battle_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id uuid NOT NULL REFERENCES public.battles(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewer_ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create unique index for views
CREATE UNIQUE INDEX idx_battle_views_unique ON public.battle_views (battle_id, COALESCE(viewer_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(viewer_ip, ''));

-- Enable RLS
ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_views ENABLE ROW LEVEL SECURITY;

-- Battles policies
CREATE POLICY "Anyone can view battles" ON public.battles
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create battles" ON public.battles
  FOR INSERT WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Participants can update their battle" ON public.battles
  FOR UPDATE USING (
    auth.uid() = challenger_id OR 
    auth.uid() = opponent_id OR 
    has_role(auth.uid(), 'judge'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'dev'::app_role)
  );

CREATE POLICY "Challengers can delete pending battles" ON public.battles
  FOR DELETE USING (auth.uid() = challenger_id AND status = 'pending');

-- Battle votes policies
CREATE POLICY "Anyone can view votes" ON public.battle_votes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote" ON public.battle_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change their vote" ON public.battle_votes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can remove their vote" ON public.battle_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Battle views policies
CREATE POLICY "Anyone can view view counts" ON public.battle_views
  FOR SELECT USING (true);

CREATE POLICY "Anyone can record views" ON public.battle_views
  FOR INSERT WITH CHECK (true);

-- Function to sync vote counts
CREATE OR REPLACE FUNCTION public.sync_battle_vote_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c_votes integer;
  o_votes integer;
  b_record record;
BEGIN
  SELECT * INTO b_record FROM battles 
  WHERE id = COALESCE(NEW.battle_id, OLD.battle_id);
  
  SELECT COUNT(*) INTO c_votes FROM battle_votes 
  WHERE battle_id = b_record.id AND voted_for = b_record.challenger_id;
  
  SELECT COUNT(*) INTO o_votes FROM battle_votes 
  WHERE battle_id = b_record.id AND voted_for = b_record.opponent_id;
  
  UPDATE battles 
  SET challenger_votes = c_votes, opponent_votes = o_votes, updated_at = now()
  WHERE id = b_record.id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER sync_battle_votes_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.battle_votes
FOR EACH ROW EXECUTE FUNCTION public.sync_battle_vote_counts();

-- Function to sync view counts
CREATE OR REPLACE FUNCTION public.sync_battle_view_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE battles 
  SET view_count = (SELECT COUNT(*) FROM battle_views WHERE battle_id = NEW.battle_id)
  WHERE id = NEW.battle_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_battle_views_trigger
AFTER INSERT ON public.battle_views
FOR EACH ROW EXECUTE FUNCTION public.sync_battle_view_count();

-- Enable realtime for battles
ALTER PUBLICATION supabase_realtime ADD TABLE public.battles;

-- Create indexes for performance
CREATE INDEX idx_battles_status ON public.battles(status);
CREATE INDEX idx_battles_league ON public.battles(league_tier);
CREATE INDEX idx_battles_challenger ON public.battles(challenger_id);
CREATE INDEX idx_battles_opponent ON public.battles(opponent_id);
CREATE INDEX idx_battle_votes_battle ON public.battle_votes(battle_id);
CREATE INDEX idx_battle_views_battle ON public.battle_views(battle_id);