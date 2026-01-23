
-- Friendly Competitions table
CREATE TABLE public.friendly_tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  max_players INTEGER NOT NULL DEFAULT 8,
  current_players INTEGER NOT NULL DEFAULT 0,
  judge_id UUID,
  judge_username TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, filling, live, bracket, completed, cancelled
  bracket_data JSONB DEFAULT '{}',
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT valid_player_count CHECK (max_players IN (2, 4, 8, 16)),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'filling', 'live', 'bracket', 'completed', 'cancelled'))
);

-- Participants in friendly tournaments
CREATE TABLE public.friendly_tournament_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.friendly_tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  submission_url TEXT,
  submission_platform TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  bracket_position INTEGER,
  eliminated_at TIMESTAMP WITH TIME ZONE,
  final_rank INTEGER,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(tournament_id, user_id)
);

-- Enable RLS
ALTER TABLE public.friendly_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendly_tournament_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for friendly_tournaments
CREATE POLICY "Anyone can view friendly tournaments"
  ON public.friendly_tournaments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create tournaments"
  ON public.friendly_tournaments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = creator_id);

CREATE POLICY "Creator can update their tournament"
  ON public.friendly_tournaments FOR UPDATE
  USING (auth.uid() = creator_id OR auth.uid() = judge_id);

CREATE POLICY "Creator can delete pending tournament"
  ON public.friendly_tournaments FOR DELETE
  USING (auth.uid() = creator_id AND status = 'pending');

-- RLS Policies for participants
CREATE POLICY "Anyone can view participants"
  ON public.friendly_tournament_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can join tournaments"
  ON public.friendly_tournament_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participation"
  ON public.friendly_tournament_participants FOR UPDATE
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM friendly_tournaments ft 
    WHERE ft.id = tournament_id AND (ft.creator_id = auth.uid() OR ft.judge_id = auth.uid())
  ));

CREATE POLICY "Users can leave pending tournaments"
  ON public.friendly_tournament_participants FOR DELETE
  USING (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM friendly_tournaments ft 
    WHERE ft.id = tournament_id AND ft.status IN ('pending', 'filling')
  ));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendly_tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendly_tournament_participants;
