CREATE OR REPLACE FUNCTION public.get_mission_leaderboard(_mission_id uuid DEFAULT NULL)
RETURNS TABLE(user_id uuid, username text, avatar_url text, total_cents bigint, posts bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    agg.user_id,
    COALESCE(
      NULLIF(u.raw_user_meta_data->>'username', ''),
      -- strip auto-generated _xxxx hex suffix from profile username
      regexp_replace(p.username, '_[a-f0-9]{4}$', ''),
      'editor'
    ) AS username,
    p.avatar_url,
    agg.total_cents,
    agg.posts
  FROM (
    SELECT ms.user_id,
           SUM(ms.total_earned_cents)::bigint AS total_cents,
           COUNT(*)::bigint AS posts
    FROM public.mission_submissions ms
    WHERE ms.status = 'approved'
      AND (_mission_id IS NULL OR ms.mission_id = _mission_id)
    GROUP BY ms.user_id
  ) agg
  LEFT JOIN public.profiles p ON p.id = agg.user_id
  LEFT JOIN auth.users u ON u.id = agg.user_id
  ORDER BY agg.total_cents DESC;
$$;