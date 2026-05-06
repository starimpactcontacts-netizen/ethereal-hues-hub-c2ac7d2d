
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
  WITH agg AS (
    SELECT
      ms.user_id,
      SUM(ms.total_earned_cents)::bigint AS total_cents,
      COUNT(*)::bigint AS posts
    FROM public.mission_submissions ms
    WHERE ms.status = 'approved'
      AND ms.user_id IS NOT NULL
      AND (_mission_id IS NULL OR ms.mission_id = _mission_id)
    GROUP BY ms.user_id
    HAVING SUM(ms.total_earned_cents) > 0
  )
  SELECT
    a.user_id,
    COALESCE(
      NULLIF(u.raw_user_meta_data->>'username', ''),
      NULLIF(p.username, ''),
      'editor'
    ) AS username,
    p.avatar_url,
    a.total_cents,
    a.posts
  FROM agg a
  LEFT JOIN public.profiles p ON p.id = a.user_id
  LEFT JOIN auth.users u ON u.id = a.user_id
  ORDER BY a.total_cents DESC
  LIMIT 100;
$$;
