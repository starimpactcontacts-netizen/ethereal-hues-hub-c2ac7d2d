-- Create RPC for users to delete their own account
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Remove role rows (FK-safe)
  DELETE FROM public.user_roles WHERE user_id = uid;

  -- Delete profile (most tables FK-cascade off auth.users or are nullable)
  DELETE FROM public.profiles WHERE id = uid;

  -- Finally remove the auth user — cascades through auth-owned data
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_user_account() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;