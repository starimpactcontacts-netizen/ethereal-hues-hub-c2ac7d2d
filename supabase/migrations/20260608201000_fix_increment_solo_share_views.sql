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
