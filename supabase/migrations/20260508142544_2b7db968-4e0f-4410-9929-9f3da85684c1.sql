CREATE OR REPLACE FUNCTION public.get_user_global_rank(p_user_id uuid)
RETURNS TABLE(rank integer, total integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (
    SELECT
      COALESCE(global_index_score, 0) AS gis,
      COALESCE(best_gatekeeper_qoi, 0) AS bgq,
      COALESCE(level, 0) AS lvl,
      COALESCE(xp, 0) AS xp
    FROM public.profiles
    WHERE id = p_user_id AND is_hidden = false
  ),
  ahead AS (
    SELECT COUNT(*)::int AS c
    FROM public.profiles p, me
    WHERE p.is_hidden = false
      AND (
        COALESCE(p.global_index_score, 0) > me.gis
        OR (COALESCE(p.global_index_score, 0) = me.gis
            AND COALESCE(p.best_gatekeeper_qoi, 0) > me.bgq)
        OR (COALESCE(p.global_index_score, 0) = me.gis
            AND COALESCE(p.best_gatekeeper_qoi, 0) = me.bgq
            AND COALESCE(p.level, 0) > me.lvl)
        OR (COALESCE(p.global_index_score, 0) = me.gis
            AND COALESCE(p.best_gatekeeper_qoi, 0) = me.bgq
            AND COALESCE(p.level, 0) = me.lvl
            AND COALESCE(p.xp, 0) > me.xp)
      )
  ),
  total AS (
    SELECT COUNT(*)::int AS c FROM public.profiles WHERE is_hidden = false
  )
  SELECT (ahead.c + 1) AS rank, total.c AS total
  FROM ahead, total, me;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_global_rank(uuid) TO anon, authenticated;