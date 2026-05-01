-- 1) Add guest-tracking columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_guest boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS prompted_for_password_at timestamptz;

-- 2) Replace handle_new_user to support anonymous signups (no email)
--    and to guarantee a unique username even when metadata collides.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  chosen_username text;
  base_username   text;
  candidate       text;
  attempts        int := 0;
  is_anon         boolean;
BEGIN
  is_anon := COALESCE((NEW.raw_app_meta_data ->> 'provider') = 'anonymous', false)
             OR NEW.is_anonymous IS TRUE
             OR NEW.email IS NULL;

  -- Prefer explicit username from signup metadata
  chosen_username := NULLIF(TRIM(NEW.raw_user_meta_data ->> 'username'), '');

  -- Fallback base
  IF chosen_username IS NULL THEN
    IF NEW.email IS NOT NULL AND NEW.email <> '' THEN
      base_username := LOWER(SPLIT_PART(NEW.email, '@', 1));
    ELSE
      base_username := 'guest';
    END IF;
    chosen_username := base_username;
  END IF;

  -- Sanitize to allowed charset
  chosen_username := REGEXP_REPLACE(chosen_username, '[^a-zA-Z0-9_]', '', 'g');
  IF chosen_username = '' OR chosen_username IS NULL THEN
    chosen_username := 'guest';
  END IF;

  -- Ensure uniqueness (case-insensitive). If collision, append short suffix.
  candidate := chosen_username;
  WHILE EXISTS (
    SELECT 1 FROM public.profiles WHERE LOWER(username) = LOWER(candidate)
  ) LOOP
    attempts := attempts + 1;
    candidate := chosen_username || '_' || SUBSTR(MD5(RANDOM()::text || NEW.id::text || attempts::text), 1, 4);
    EXIT WHEN attempts > 12;
  END LOOP;

  INSERT INTO public.profiles (
    id,
    email,
    username,
    display_name,
    created_at,
    updated_at,
    xp,
    level,
    league,
    onboarding_completed,
    username_changed_at,
    is_guest
  )
  VALUES (
    NEW.id,
    NEW.email,
    candidate,
    candidate,
    NOW(),
    NOW(),
    0,
    1,
    'open',
    is_anon,           -- anon users are pre-onboarded, they're already in
    NULL,
    is_anon
  );

  RETURN NEW;
END;
$function$;

-- 3) Helper the app calls after the guest sets a real password (and optionally email)
CREATE OR REPLACE FUNCTION public.mark_account_converted()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles
  SET is_guest = false,
      onboarding_completed = true,
      updated_at = now()
  WHERE id = auth.uid();
$$;

-- 4) Helper to bump the prompted-at timestamp (used to space out nudges)
CREATE OR REPLACE FUNCTION public.mark_password_prompted()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles
  SET prompted_for_password_at = now()
  WHERE id = auth.uid();
$$;

-- 5) Allow authenticated users (incl. anon) to call the helpers
GRANT EXECUTE ON FUNCTION public.mark_account_converted() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_password_prompted() TO authenticated;