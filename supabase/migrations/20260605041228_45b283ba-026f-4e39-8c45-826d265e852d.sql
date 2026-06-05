CREATE OR REPLACE FUNCTION public.sync_quick_fight_vote_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_fight_id uuid;
BEGIN
  target_fight_id := COALESCE(NEW.fight_id, OLD.fight_id);

  UPDATE public.quick_fights q
  SET
    player_1_votes = (
      SELECT count(*)::int
      FROM public.quick_fight_votes v
      WHERE v.fight_id = q.id
        AND v.voted_for = q.player_1_id
    ),
    player_2_votes = (
      SELECT count(*)::int
      FROM public.quick_fight_votes v
      WHERE v.fight_id = q.id
        AND v.voted_for = q.player_2_id
    )
  WHERE q.id = target_fight_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_quick_fight_vote_counts ON public.quick_fight_votes;

CREATE TRIGGER trg_sync_quick_fight_vote_counts
AFTER INSERT OR UPDATE OR DELETE ON public.quick_fight_votes
FOR EACH ROW
EXECUTE FUNCTION public.sync_quick_fight_vote_counts();

UPDATE public.quick_fights q
SET
  player_1_votes = (
    SELECT count(*)::int
    FROM public.quick_fight_votes v
    WHERE v.fight_id = q.id
      AND v.voted_for = q.player_1_id
  ),
  player_2_votes = (
    SELECT count(*)::int
    FROM public.quick_fight_votes v
    WHERE v.fight_id = q.id
      AND v.voted_for = q.player_2_id
  )
WHERE EXISTS (
  SELECT 1
  FROM public.quick_fight_votes v
  WHERE v.fight_id = q.id
)
OR q.player_1_votes <> 0
OR q.player_2_votes <> 0;