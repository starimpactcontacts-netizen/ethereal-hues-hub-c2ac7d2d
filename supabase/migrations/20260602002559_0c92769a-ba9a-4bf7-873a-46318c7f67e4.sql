CREATE OR REPLACE FUNCTION public.reserve_quick_fight_slot(
  p_fight_id uuid,
  p_user_id uuid,
  p_username text,
  p_avatar_url text,
  p_code text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fight public.quick_fights%ROWTYPE;
BEGIN
  SELECT * INTO v_fight FROM public.quick_fights WHERE id = p_fight_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;
  IF v_fight.status <> 'waiting' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_waiting');
  END IF;
  IF v_fight.player_1_id = p_user_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'is_host');
  END IF;
  IF v_fight.player_2_id IS NOT NULL AND v_fight.player_2_id <> p_user_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'slot_taken');
  END IF;
  IF v_fight.is_private THEN
    IF p_code IS NULL OR upper(trim(p_code)) <> upper(coalesce(v_fight.join_code, '')) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'bad_code');
    END IF;
  END IF;

  UPDATE public.quick_fights
  SET player_2_id = p_user_id,
      player_2_username = p_username,
      player_2_avatar_url = p_avatar_url
  WHERE id = p_fight_id AND status = 'waiting' AND (player_2_id IS NULL OR player_2_id = p_user_id);

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.reserve_quick_fight_slot(uuid, uuid, text, text, text) TO authenticated;