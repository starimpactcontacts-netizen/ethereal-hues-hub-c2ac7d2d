
CREATE OR REPLACE FUNCTION public.get_mission_leaderboard(_mission_id uuid DEFAULT NULL)
RETURNS TABLE (
  user_id uuid,
  username text,
  avatar_url text,
  total_cents bigint,
  posts bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ms.user_id,
    COALESCE(MAX(ms.username), 'editor') AS username,
    MAX(ms.avatar_url) AS avatar_url,
    SUM(ms.total_earned_cents)::bigint AS total_cents,
    COUNT(*)::bigint AS posts
  FROM public.mission_submissions ms
  WHERE ms.status = 'approved'
    AND ms.user_id IS NOT NULL
    AND (_mission_id IS NULL OR ms.mission_id = _mission_id)
  GROUP BY ms.user_id
  HAVING SUM(ms.total_earned_cents) > 0
  ORDER BY total_cents DESC
  LIMIT 100;
$$;

GRANT EXECUTE ON FUNCTION public.get_mission_leaderboard(uuid) TO anon, authenticated;
