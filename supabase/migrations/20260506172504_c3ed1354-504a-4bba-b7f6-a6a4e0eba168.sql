
-- Add private lobby support to quick_fights
ALTER TABLE public.quick_fights
  ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS join_code text;

CREATE INDEX IF NOT EXISTS idx_quick_fights_join_code ON public.quick_fights(join_code) WHERE join_code IS NOT NULL;

-- Helper to generate a short unique join code
CREATE OR REPLACE FUNCTION public.generate_quick_fight_join_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code text;
  exists_already boolean;
BEGIN
  LOOP
    code := upper(substr(encode(gen_random_bytes(6), 'base64'), 1, 6));
    code := regexp_replace(code, '[^A-Z0-9]', '', 'g');
    IF length(code) < 6 THEN
      CONTINUE;
    END IF;
    SELECT EXISTS(SELECT 1 FROM public.quick_fights WHERE join_code = code AND status = 'waiting') INTO exists_already;
    EXIT WHEN NOT exists_already;
  END LOOP;
  RETURN code;
END;
$$;

-- Update join function to enforce private lobby code
CREATE OR REPLACE FUNCTION public.join_waiting_quick_fight(
  p_fight_id uuid,
  p_user_id uuid,
  p_username text,
  p_avatar_url text DEFAULT NULL::text,
  p_join_code text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  fight RECORD;
  starts timestamptz := now();
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO fight
  FROM public.quick_fights
  WHERE id = p_fight_id
  FOR UPDATE;

  IF fight IS NULL THEN
    RAISE EXCEPTION 'Lobby not found';
  END IF;

  IF fight.status <> 'waiting' OR fight.player_2_id IS NOT NULL THEN
    RAISE EXCEPTION 'Lobby is no longer open';
  END IF;

  IF fight.player_1_id = p_user_id THEN
    RAISE EXCEPTION 'Owner cannot join their own lobby';
  END IF;

  IF fight.is_private THEN
    IF p_join_code IS NULL OR upper(trim(p_join_code)) <> fight.join_code THEN
      RAISE EXCEPTION 'Invalid join code';
    END IF;
  END IF;

  DELETE FROM public.quick_fight_queue WHERE user_id = p_user_id;

  UPDATE public.quick_fights
  SET
    player_2_id = p_user_id,
    player_2_username = p_username,
    player_2_avatar_url = p_avatar_url,
    status = 'active',
    matched_at = starts,
    starts_at = starts,
    ends_at = starts + interval '1 hour',
    duration_minutes = 60
  WHERE id = p_fight_id;

  INSERT INTO public.quick_fight_messages (fight_id, user_id, username, message_text, is_system)
  VALUES (p_fight_id, '00000000-0000-0000-0000-000000000000'::uuid, 'System', '⚔️ FIGHT STARTED! You have 1 hour to submit your edit.', true);

  RETURN p_fight_id;
END;
$function$;
