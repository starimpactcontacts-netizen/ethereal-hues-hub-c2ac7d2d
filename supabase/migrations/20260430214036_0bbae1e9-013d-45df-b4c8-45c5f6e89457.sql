
-- Forfeit a 1v1 battle (caller must be challenger or opponent)
CREATE OR REPLACE FUNCTION public.battle_forfeit(p_battle_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_battle public.battles%ROWTYPE;
  v_winner uuid;
BEGIN
  IF v_uid IS NULL THEN RETURN false; END IF;
  SELECT * INTO v_battle FROM public.battles WHERE id = p_battle_id FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF v_battle.challenger_id <> v_uid AND v_battle.opponent_id <> v_uid THEN
    RETURN false;
  END IF;
  IF v_battle.status NOT IN ('pending','accepted','active','judging') THEN
    RETURN false;
  END IF;

  IF v_uid = v_battle.challenger_id THEN
    v_winner := v_battle.opponent_id;
  ELSE
    v_winner := v_battle.challenger_id;
  END IF;

  UPDATE public.battles
  SET status = 'forfeited',
      winner_id = v_winner,
      judge_notes = COALESCE(judge_notes,'') || ' [Forfeited by user]'
  WHERE id = p_battle_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.battle_forfeit(uuid) TO authenticated;

-- Forfeit a quick fight (caller must be one of the players)
CREATE OR REPLACE FUNCTION public.quick_fight_forfeit(p_fight_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_fight public.quick_fights%ROWTYPE;
  v_winner uuid;
BEGIN
  IF v_uid IS NULL THEN RETURN false; END IF;
  SELECT * INTO v_fight FROM public.quick_fights WHERE id = p_fight_id FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF v_fight.player_1_id <> v_uid AND COALESCE(v_fight.player_2_id, '00000000-0000-0000-0000-000000000000'::uuid) <> v_uid THEN
    RETURN false;
  END IF;
  IF v_fight.status NOT IN ('waiting','active','submitted','judging') THEN
    RETURN false;
  END IF;

  IF v_uid = v_fight.player_1_id THEN
    v_winner := v_fight.player_2_id;
  ELSE
    v_winner := v_fight.player_1_id;
  END IF;

  UPDATE public.quick_fights
  SET status = 'forfeited',
      winner_id = v_winner,
      judge_notes = COALESCE(judge_notes,'') || ' [Forfeited by user]',
      judged_at = now()
  WHERE id = p_fight_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.quick_fight_forfeit(uuid) TO authenticated;
