-- confirmed_at is a generated column; only set email_confirmed_at.

UPDATE auth.users
SET email_confirmed_at = now()
WHERE email LIKE '%@loopgate.local'
  AND email_confirmed_at IS NULL;

CREATE OR REPLACE FUNCTION public.auto_confirm_placeholder_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NEW.email IS NOT NULL
     AND NEW.email LIKE '%@loopgate.local'
     AND NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_confirm_placeholder_email ON auth.users;
CREATE TRIGGER trg_auto_confirm_placeholder_email
BEFORE INSERT OR UPDATE OF email ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_confirm_placeholder_email();