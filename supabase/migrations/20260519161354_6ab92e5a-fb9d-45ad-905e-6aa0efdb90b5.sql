
-- Drop the legacy 4-arg overload (buggy + unused) to remove ambiguity
DROP FUNCTION IF EXISTS public.join_waiting_quick_fight(uuid, uuid, text, text);

-- Replace the 5-arg version to honor the lobby's stored duration_minutes
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
  duration_mins int;
  duration_label text;
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

  duration_mins := COALESCE(fight.duration_minutes, 60);
  duration_label := CASE
    WHEN duration_mins >= 60 AND duration_mins % 60 = 0 THEN (duration_mins / 60)::text || ' hour' || CASE WHEN duration_mins / 60 = 1 THEN '' ELSE 's' END
    ELSE duration_mins::text || ' minutes'
  END;

  DELETE FROM public.quick_fight_queue WHERE user_id = p_user_id;

  UPDATE public.quick_fights
  SET
    player_2_id = p_user_id,
    player_2_username = p_username,
    player_2_avatar_url = p_avatar_url,
    status = 'active',
    matched_at = starts,
    starts_at = starts,
    ends_at = starts + make_interval(mins => duration_mins)
  WHERE id = p_fight_id;

  INSERT INTO public.quick_fight_messages (fight_id, user_id, username, message_text, is_system)
  VALUES (
    p_fight_id,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'System',
    '⚔️ FIGHT STARTED! You have ' || duration_label || ' to submit your edit.',
    true
  );

  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES
    (fight.player_1_id, 'quick_fight', '⚔️ Custom Lobby Joined!', '@' || p_username || ' joined your edit battle.', jsonb_build_object('fight_id', p_fight_id)),
    (p_user_id, 'quick_fight', '⚔️ Edit Battle Started!', 'You joined @' || fight.player_1_username || '''s edit battle.', jsonb_build_object('fight_id', p_fight_id));

  RETURN p_fight_id;
END;
$function$;
