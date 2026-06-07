-- Viewers other than the owner can't UPDATE solo_shares directly (RLS only
-- allows the owner), so the client-side view bump in SoloSharePage silently
-- no-ops for everyone else. Route it through a SECURITY DEFINER bump instead.
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
