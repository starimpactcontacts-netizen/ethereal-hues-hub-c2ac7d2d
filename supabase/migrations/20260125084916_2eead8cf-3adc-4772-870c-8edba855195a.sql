-- Add tournament mode and challenged crew fields to sanctioned_tournaments
ALTER TABLE public.sanctioned_tournaments
ADD COLUMN tournament_mode TEXT NOT NULL DEFAULT 'open',
ADD COLUMN challenged_crew_id UUID REFERENCES public.crews(id),
ADD COLUMN challenged_crew_name TEXT,
ADD COLUMN challenged_crew_avatar_url TEXT,
ADD COLUMN challenge_accepted BOOLEAN DEFAULT NULL,
ADD COLUMN challenge_accepted_at TIMESTAMP WITH TIME ZONE;

-- Add constraint for tournament_mode values
ALTER TABLE public.sanctioned_tournaments
ADD CONSTRAINT valid_tournament_mode CHECK (tournament_mode IN ('open', 'crew_vs_crew'));

-- Add constraint: crew_vs_crew mode requires challenged_crew_id
ALTER TABLE public.sanctioned_tournaments
ADD CONSTRAINT crew_vs_crew_requires_challenged CHECK (
  tournament_mode = 'open' OR challenged_crew_id IS NOT NULL
);

-- Index for faster rival-based queries
CREATE INDEX idx_sanctioned_tournaments_challenged_crew ON public.sanctioned_tournaments(challenged_crew_id);
CREATE INDEX idx_sanctioned_tournaments_mode ON public.sanctioned_tournaments(tournament_mode);