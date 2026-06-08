-- The increment_solo_share_views RPC (added in 20260607013500) was created
-- without an explicit EXECUTE grant, unlike every other client-callable
-- SECURITY DEFINER function in this project (get_user_global_rank,
-- join_private_competition, claim_daily_reward, etc). Without it, anon and
-- authenticated callers hit a permission error that the client silently
-- swallows — so the view count never moves. Re-declare (idempotent, in case
-- the prior migration hasn't run yet either) and grant explicitly.
CREATE OR REPLACE FUNCTION public.increment_solo_share_views(share_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.solo_shares
  SET views = COALESCE(views, 0) + 1
  WHERE id = share_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_solo_share_views(UUID) TO anon, authenticated;
