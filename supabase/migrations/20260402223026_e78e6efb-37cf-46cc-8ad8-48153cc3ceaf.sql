CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  chosen_username TEXT;
  fallback_username TEXT;
BEGIN
  -- Use the username from signup metadata if provided
  chosen_username := TRIM(NEW.raw_user_meta_data ->> 'username');
  
  -- If no username in metadata, generate a fallback
  IF chosen_username IS NULL OR chosen_username = '' THEN
    fallback_username := LOWER(SPLIT_PART(NEW.email, '@', 1)) || '_' || SUBSTR(MD5(RANDOM()::TEXT), 1, 4);
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = fallback_username) LOOP
      fallback_username := LOWER(SPLIT_PART(NEW.email, '@', 1)) || '_' || SUBSTR(MD5(RANDOM()::TEXT), 1, 4);
    END LOOP;
    chosen_username := fallback_username;
  END IF;

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
    username_changed_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    chosen_username,
    chosen_username,
    NOW(),
    NOW(),
    0,
    1,
    'open',
    false,
    NULL
  );
  
  RETURN NEW;
END;
$function$;