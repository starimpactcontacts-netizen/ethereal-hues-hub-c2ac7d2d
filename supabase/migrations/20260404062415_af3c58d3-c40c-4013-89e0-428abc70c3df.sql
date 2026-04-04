
-- Add new columns for the competition system
ALTER TABLE public.hosted_competitions
  ADD COLUMN IF NOT EXISTS song_name text,
  ADD COLUMN IF NOT EXISTS song_preview_url text,
  ADD COLUMN IF NOT EXISTS league_suggestion text DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS scoring_mode text DEFAULT 'judged',
  ADD COLUMN IF NOT EXISTS max_participants integer DEFAULT 100,
  ADD COLUMN IF NOT EXISTS index_reward_pool integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cover_image_url text;

-- Add submission_url and platform to participants so they can submit edits
ALTER TABLE public.hosted_competition_participants
  ADD COLUMN IF NOT EXISTS submission_url text,
  ADD COLUMN IF NOT EXISTS platform text,
  ADD COLUMN IF NOT EXISTS qoi_score numeric,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'joined',
  ADD COLUMN IF NOT EXISTS submitted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS thumbnail_url text;

-- Function to calculate index reward based on participant count
CREATE OR REPLACE FUNCTION public.calculate_comp_index_reward(participant_count integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN participant_count >= 100 THEN 500
    WHEN participant_count >= 75 THEN 350
    WHEN participant_count >= 50 THEN 200
    WHEN participant_count >= 25 THEN 100
    WHEN participant_count >= 10 THEN 50
    WHEN participant_count >= 5 THEN 25
    WHEN participant_count >= 2 THEN 10
    ELSE 0
  END
$$;

-- Trigger to auto-update index_reward_pool when participant count changes
CREATE OR REPLACE FUNCTION public.update_comp_reward_pool()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.hosted_competitions
  SET index_reward_pool = public.calculate_comp_index_reward(
    (SELECT COUNT(*)::integer FROM public.hosted_competition_participants WHERE competition_id = COALESCE(NEW.competition_id, OLD.competition_id))
  )
  WHERE id = COALESCE(NEW.competition_id, OLD.competition_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS update_comp_reward_on_join ON public.hosted_competition_participants;
CREATE TRIGGER update_comp_reward_on_join
  AFTER INSERT OR DELETE ON public.hosted_competition_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_comp_reward_pool();
