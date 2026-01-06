-- Add display_name column for user's public name (can be anything, changeable anytime)
ALTER TABLE public.profiles 
ADD COLUMN display_name text;

-- Add username_changed_at to track when username was last changed (14-day cooldown)
ALTER TABLE public.profiles 
ADD COLUMN username_changed_at timestamp with time zone DEFAULT now();

-- Create function to check if username can be changed (14-day cooldown)
CREATE OR REPLACE FUNCTION public.can_change_username(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT username_changed_at + INTERVAL '14 days' < now() 
     FROM public.profiles 
     WHERE id = user_uuid),
    true
  )
$$;

-- Create function to get days until username can be changed
CREATE OR REPLACE FUNCTION public.days_until_username_change(user_uuid uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT GREATEST(0, 
    EXTRACT(DAY FROM (
      (SELECT username_changed_at + INTERVAL '14 days' FROM public.profiles WHERE id = user_uuid) - now()
    ))::integer
  )
$$;