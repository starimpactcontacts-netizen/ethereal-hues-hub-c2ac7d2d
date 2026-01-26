-- Add participation index and per-win index columns to sanctioned tournaments
ALTER TABLE public.sanctioned_tournaments
ADD COLUMN IF NOT EXISTS participation_index integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS per_win_index integer DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.sanctioned_tournaments.participation_index IS 'Index points awarded to all participants who submit';
COMMENT ON COLUMN public.sanctioned_tournaments.per_win_index IS 'Index points awarded per bracket match win';