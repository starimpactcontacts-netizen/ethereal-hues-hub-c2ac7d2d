CREATE OR REPLACE FUNCTION public.finalize_expired_competitions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  comp RECORD;
  winner_id UUID;
BEGIN
  FOR comp IN
    SELECT id
    FROM public.competitions
    WHERE status = 'voting'
      AND voting_deadline IS NOT NULL
      AND voting_deadline <= now()
  LOOP
    SELECT id INTO winner_id
    FROM public.competition_submissions
    WHERE competition_id = comp.id
    ORDER BY COALESCE(vote_count, 0) DESC, created_at DESC
    LIMIT 1;

    IF winner_id IS NOT NULL THEN
      UPDATE public.competition_submissions
      SET is_winner = (id = winner_id),
          winner_place = CASE WHEN id = winner_id THEN 1 ELSE winner_place END,
          scored_at = CASE WHEN id = winner_id THEN COALESCE(scored_at, now()) ELSE scored_at END
      WHERE competition_id = comp.id;
    END IF;

    UPDATE public.competitions
    SET status = CASE WHEN winner_id IS NULL THEN 'closed' ELSE 'completed' END,
        updated_at = now()
    WHERE id = comp.id;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_competition_if_expired(p_competition_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  comp RECORD;
  winner_id UUID;
BEGIN
  SELECT id, status, voting_deadline INTO comp
  FROM public.competitions
  WHERE id = p_competition_id;

  IF comp.id IS NULL OR comp.status <> 'voting' OR comp.voting_deadline IS NULL OR comp.voting_deadline > now() THEN
    RETURN false;
  END IF;

  SELECT id INTO winner_id
  FROM public.competition_submissions
  WHERE competition_id = p_competition_id
  ORDER BY COALESCE(vote_count, 0) DESC, created_at DESC
  LIMIT 1;

  IF winner_id IS NOT NULL THEN
    UPDATE public.competition_submissions
    SET is_winner = (id = winner_id),
        winner_place = CASE WHEN id = winner_id THEN 1 ELSE winner_place END,
        scored_at = CASE WHEN id = winner_id THEN COALESCE(scored_at, now()) ELSE scored_at END
    WHERE competition_id = p_competition_id;
  END IF;

  UPDATE public.competitions
  SET status = CASE WHEN winner_id IS NULL THEN 'closed' ELSE 'completed' END,
      updated_at = now()
  WHERE id = p_competition_id;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_finalize_expired_competitions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.finalize_expired_competitions();
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_finalize_expired_competitions_on_competitions ON public.competitions;
CREATE TRIGGER trg_finalize_expired_competitions_on_competitions
AFTER INSERT OR UPDATE ON public.competitions
FOR EACH STATEMENT
EXECUTE FUNCTION public.trigger_finalize_expired_competitions();

DROP TRIGGER IF EXISTS trg_finalize_expired_competitions_on_votes ON public.competition_votes;
CREATE TRIGGER trg_finalize_expired_competitions_on_votes
AFTER INSERT OR DELETE ON public.competition_votes
FOR EACH STATEMENT
EXECUTE FUNCTION public.trigger_finalize_expired_competitions();

DROP POLICY IF EXISTS "Participants can close expired voting" ON public.competitions;
CREATE POLICY "Participants can close expired voting"
ON public.competitions
FOR UPDATE TO authenticated
USING (
  status = 'voting'
  AND voting_deadline IS NOT NULL
  AND voting_deadline <= now()
  AND EXISTS (
    SELECT 1
    FROM public.competition_participants cp
    WHERE cp.competition_id = competitions.id
      AND cp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.competition_participants cp
    WHERE cp.competition_id = competitions.id
      AND cp.user_id = auth.uid()
  )
);