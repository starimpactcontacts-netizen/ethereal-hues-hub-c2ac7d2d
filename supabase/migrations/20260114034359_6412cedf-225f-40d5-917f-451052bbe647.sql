-- Update handle_new_user to set username_changed_at to NULL so new users can change immediately
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  random_username TEXT;
BEGIN
  -- Generate a unique username from email prefix + random suffix
  random_username := LOWER(SPLIT_PART(NEW.email, '@', 1)) || '_' || SUBSTR(MD5(RANDOM()::TEXT), 1, 4);
  
  -- Ensure uniqueness by checking if it exists
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = random_username) LOOP
    random_username := LOWER(SPLIT_PART(NEW.email, '@', 1)) || '_' || SUBSTR(MD5(RANDOM()::TEXT), 1, 4);
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
    username_changed_at  -- Set to NULL so first change is allowed immediately
  )
  VALUES (
    NEW.id,
    NEW.email,
    random_username,
    SPLIT_PART(NEW.email, '@', 1),
    NOW(),
    NOW(),
    0,
    1,
    'open',
    false,
    NULL  -- NULL allows immediate username change for new users
  );
  
  RETURN NEW;
END;
$function$;