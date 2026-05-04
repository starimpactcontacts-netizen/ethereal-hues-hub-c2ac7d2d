
-- Update default duration on quick_fights table
ALTER TABLE public.quick_fights ALTER COLUMN duration_minutes SET DEFAULT 60;

-- Rewrite quick_fight_match to use 1 hour
CREATE OR REPLACE FUNCTION public.quick_fight_match(p_user_id uuid, p_username text, p_avatar_url text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  matched RECORD;
  new_fight_id UUID;
  starts TIMESTAMPTZ := now();
BEGIN
  DELETE FROM public.quick_fight_queue WHERE expires_at < now();

  SELECT * INTO matched
  FROM public.quick_fight_queue
  WHERE user_id != p_user_id
    AND expires_at > now()
  ORDER BY queued_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF matched IS NULL THEN
    INSERT INTO public.quick_fight_queue (user_id, username, avatar_url)
    VALUES (p_user_id, p_username, p_avatar_url)
    ON CONFLICT (user_id) DO UPDATE
    SET username = p_username, avatar_url = p_avatar_url, queued_at = now(), expires_at = now() + INTERVAL '5 minutes';
    RETURN NULL;
  END IF;

  INSERT INTO public.quick_fights (
    player_1_id, player_1_username, player_1_avatar_url,
    player_2_id, player_2_username, player_2_avatar_url,
    status, matched_at, starts_at, ends_at, duration_minutes
  ) VALUES (
    matched.user_id, matched.username, matched.avatar_url,
    p_user_id, p_username, p_avatar_url,
    'active', starts, starts, starts + INTERVAL '1 hour', 60
  )
  RETURNING id INTO new_fight_id;

  DELETE FROM public.quick_fight_queue WHERE user_id IN (p_user_id, matched.user_id);

  INSERT INTO public.quick_fight_messages (fight_id, user_id, username, message_text, is_system)
  VALUES (new_fight_id, '00000000-0000-0000-0000-000000000000'::uuid, 'System', '⚔️ FIGHT STARTED! You have 1 hour to submit your edit.', true);

  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES
    (matched.user_id, 'quick_fight', '⚔️ Quick Fight!', 'You''ve been matched vs @' || p_username || '!', jsonb_build_object('fight_id', new_fight_id)),
    (p_user_id, 'quick_fight', '⚔️ Quick Fight!', 'You''ve been matched vs @' || matched.username || '!', jsonb_build_object('fight_id', new_fight_id));

  RETURN new_fight_id;
END;
$function$;

-- Shorten existing in-flight fights still showing 3hr to 1hr from their start
UPDATE public.quick_fights
SET duration_minutes = 60,
    ends_at = COALESCE(starts_at, matched_at, created_at) + INTERVAL '1 hour'
WHERE status IN ('active', 'waiting')
  AND duration_minutes > 60;
