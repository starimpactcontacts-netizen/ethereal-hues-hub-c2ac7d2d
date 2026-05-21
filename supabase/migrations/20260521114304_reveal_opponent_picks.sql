CREATE OR REPLACE FUNCTION public.get_quick_fight_selection_state(p_fight_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  fight record;
  v_user uuid := auth.uid();
  v_side text;
  my_sel record;
  opp_sel record;
  reveal boolean;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO fight FROM public.quick_fights WHERE id = p_fight_id;
  IF fight IS NULL THEN RAISE EXCEPTION 'Fight not found'; END IF;

  IF v_user = fight.player_1_id THEN
    v_side := 'red';
  ELSIF v_user = fight.player_2_id THEN
    v_side := 'blue';
  ELSE
    RAISE EXCEPTION 'Not a participant';
  END IF;

  SELECT * INTO my_sel FROM public.quick_fight_selections WHERE fight_id = p_fight_id AND player_id = v_user;
  SELECT * INTO opp_sel FROM public.quick_fight_selections WHERE fight_id = p_fight_id AND player_id <> v_user LIMIT 1;

  reveal := fight.status <> 'selecting'
    OR (COALESCE(fight.player_1_selection_ready, false) AND COALESCE(fight.player_2_selection_ready, false))
    OR (fight.selection_deadline IS NOT NULL AND fight.selection_deadline <= now());

  RETURN jsonb_build_object(
    'status', fight.status,
    'selectionStartedAt', fight.selection_started_at,
    'selectionDeadline', fight.selection_deadline,
    'mySide', v_side,
    'myReady', COALESCE(my_sel.ready, false),
    'opponentReady', CASE WHEN v_side = 'red' THEN COALESCE(fight.player_2_selection_ready, false) ELSE COALESCE(fight.player_1_selection_ready, false) END,
    'bothReady', COALESCE(fight.player_1_selection_ready, false) AND COALESCE(fight.player_2_selection_ready, false),
    'reveal', reveal,
    'mine', CASE WHEN my_sel IS NULL THEN NULL ELSE jsonb_build_object(
      'pack', jsonb_build_object('id', my_sel.scenepack_id, 'name', my_sel.scenepack_name, 'poster', my_sel.scenepack_poster, 'packCount', my_sel.scenepack_count),
      'song', jsonb_build_object('id', my_sel.song_id, 'title', my_sel.song_title, 'artist', my_sel.song_artist, 'cover', my_sel.song_cover, 'preview', my_sel.song_preview),
      'ready', my_sel.ready
    ) END,
    -- Always expose opponent selections to participants; reveal screen + battle banner need them.
    'opponent', CASE WHEN opp_sel IS NULL THEN NULL ELSE jsonb_build_object(
      'pack', jsonb_build_object('id', opp_sel.scenepack_id, 'name', opp_sel.scenepack_name, 'poster', opp_sel.scenepack_poster, 'packCount', opp_sel.scenepack_count),
      'song', jsonb_build_object('id', opp_sel.song_id, 'title', opp_sel.song_title, 'artist', opp_sel.song_artist, 'cover', opp_sel.song_cover, 'preview', opp_sel.song_preview),
      'ready', opp_sel.ready
    ) END
  );
END;
$function$;
