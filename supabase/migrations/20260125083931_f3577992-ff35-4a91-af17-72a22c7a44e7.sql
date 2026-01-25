-- Sanctioned Tournaments: Crew-proposed, Admin-approved competitive events
CREATE TABLE public.sanctioned_tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Crew & Proposer
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  proposed_by UUID NOT NULL,
  crew_name TEXT NOT NULL,
  crew_avatar_url TEXT,
  
  -- Tournament Details
  name TEXT NOT NULL,
  description TEXT,
  theme TEXT,
  rules TEXT[],
  
  -- Format
  min_players INTEGER NOT NULL DEFAULT 20,
  max_players INTEGER NOT NULL DEFAULT 64,
  duration_hours INTEGER NOT NULL DEFAULT 48,
  format_type TEXT NOT NULL DEFAULT 'single_elimination', -- single_elimination, double_elimination, round_robin
  
  -- Status & Approval
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, ready_up, live, bracket, completed, cancelled
  rejection_reason TEXT,
  
  -- Admin-set fields (after approval)
  index_prize INTEGER, -- Total index points prize pool
  first_place_index INTEGER,
  second_place_index INTEGER,
  third_place_index INTEGER,
  xp_reward INTEGER DEFAULT 100,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  admin_notes TEXT,
  
  -- Scheduling
  proposed_start_date TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  ready_up_deadline TIMESTAMPTZ,
  submission_deadline TIMESTAMPTZ,
  
  -- Tracking
  player_count INTEGER NOT NULL DEFAULT 0,
  ready_count INTEGER NOT NULL DEFAULT 0,
  poster_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Participants table
CREATE TABLE public.sanctioned_tournament_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.sanctioned_tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  
  -- Status
  is_ready BOOLEAN NOT NULL DEFAULT false,
  ready_at TIMESTAMPTZ,
  
  -- Submission
  submission_url TEXT,
  submission_platform TEXT,
  submitted_at TIMESTAMPTZ,
  
  -- Bracket
  bracket_position INTEGER,
  eliminated_at TIMESTAMPTZ,
  final_rank INTEGER,
  
  -- Scoring
  qoi_score NUMERIC,
  
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(tournament_id, user_id)
);

-- Enable RLS
ALTER TABLE public.sanctioned_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanctioned_tournament_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sanctioned_tournaments
CREATE POLICY "Anyone can view approved tournaments"
ON public.sanctioned_tournaments FOR SELECT
USING (status != 'pending' OR crew_id IN (
  SELECT crew_id FROM public.crew_members WHERE user_id = auth.uid()
) OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dev'));

CREATE POLICY "Crew staff can propose tournaments"
ON public.sanctioned_tournaments FOR INSERT
WITH CHECK (is_crew_staff(crew_id, auth.uid()));

CREATE POLICY "Admins can manage all tournaments"
ON public.sanctioned_tournaments FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dev'));

CREATE POLICY "Crew staff can update pending tournaments"
ON public.sanctioned_tournaments FOR UPDATE
USING (is_crew_staff(crew_id, auth.uid()) AND status = 'pending');

-- RLS Policies for participants
CREATE POLICY "Anyone can view participants"
ON public.sanctioned_tournament_participants FOR SELECT
USING (true);

CREATE POLICY "Users can join tournaments"
ON public.sanctioned_tournament_participants FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participation"
ON public.sanctioned_tournament_participants FOR UPDATE
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can leave before tournament starts"
ON public.sanctioned_tournament_participants FOR DELETE
USING (auth.uid() = user_id AND EXISTS (
  SELECT 1 FROM public.sanctioned_tournaments 
  WHERE id = tournament_id AND status IN ('approved', 'ready_up')
));

-- Indexes
CREATE INDEX idx_sanctioned_tournaments_status ON public.sanctioned_tournaments(status);
CREATE INDEX idx_sanctioned_tournaments_crew ON public.sanctioned_tournaments(crew_id);
CREATE INDEX idx_sanctioned_participants_tournament ON public.sanctioned_tournament_participants(tournament_id);
CREATE INDEX idx_sanctioned_participants_user ON public.sanctioned_tournament_participants(user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.sanctioned_tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sanctioned_tournament_participants;