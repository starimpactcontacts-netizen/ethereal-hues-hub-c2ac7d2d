-- Table to store individual video clip files belonging to a scenepack
CREATE TABLE IF NOT EXISTS public.scenepack_videos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenepack_id uuid NOT NULL REFERENCES public.scenepack_pool(id) ON DELETE CASCADE,
  title        text,
  video_url    text NOT NULL,
  file_size_mb numeric,
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scenepack_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view scenepack videos"
ON public.scenepack_videos FOR SELECT USING (true);

CREATE POLICY "Admins can manage scenepack videos"
ON public.scenepack_videos FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_scenepack_videos_pack ON public.scenepack_videos(scenepack_id, sort_order);

-- Update get_quick_fight_selection_state to also surface pack download URLs
-- so the battle banner can enable the download / view-clips button.
CREATE OR REPLACE FUNCTION public.get_quick_fight_selection_state(p_fight_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  fight     record;
  v_user    uuid := auth.uid();
  v_side    text;
  my_sel    record;
  opp_sel   record;
  reveal    boolean;
  my_pack   record;
  opp_pack  record;
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

  SELECT * INTO my_sel  FROM public.quick_fight_selections WHERE fight_id = p_fight_id AND player_id = v_user;
  SELECT * INTO opp_sel FROM public.quick_fight_selections WHERE fight_id = p_fight_id AND player_id <> v_user LIMIT 1;

  -- Enrich with pool metadata (download URLs, video count)
  IF my_sel.scenepack_id IS NOT NULL THEN
    SELECT * INTO my_pack FROM public.scenepack_pool WHERE id::text = my_sel.scenepack_id LIMIT 1;
  END IF;
  IF opp_sel.scenepack_id IS NOT NULL THEN
    SELECT * INTO opp_pack FROM public.scenepack_pool WHERE id::text = opp_sel.scenepack_id LIMIT 1;
  END IF;

  reveal := fight.status <> 'selecting'
    OR (COALESCE(fight.player_1_selection_ready, false) AND COALESCE(fight.player_2_selection_ready, false))
    OR (fight.selection_deadline IS NOT NULL AND fight.selection_deadline <= now());

  RETURN jsonb_build_object(
    'status',           fight.status,
    'selectionStartedAt', fight.selection_started_at,
    'selectionDeadline',  fight.selection_deadline,
    'mySide',           v_side,
    'myReady',          COALESCE(my_sel.ready, false),
    'opponentReady',    CASE WHEN v_side = 'red'
                          THEN COALESCE(fight.player_2_selection_ready, false)
                          ELSE COALESCE(fight.player_1_selection_ready, false) END,
    'bothReady',        COALESCE(fight.player_1_selection_ready, false) AND COALESCE(fight.player_2_selection_ready, false),
    'reveal',           reveal,
    'mine', CASE WHEN my_sel IS NULL THEN NULL ELSE jsonb_build_object(
      'pack', jsonb_build_object(
        'id',          my_sel.scenepack_id,
        'name',        my_sel.scenepack_name,
        'poster',      my_sel.scenepack_poster,
        'packCount',   my_sel.scenepack_count,
        'youtubeUrl',  my_pack.scenepack_youtube_url,
        'gdriveUrl',   my_pack.scenepack_gdrive_url,
        'previewUrl',  my_pack.preview_video_url,
        'videoCount',  (SELECT COUNT(*) FROM public.scenepack_videos WHERE scenepack_id::text = my_sel.scenepack_id)
      ),
      'song', jsonb_build_object(
        'id',      my_sel.song_id,
        'title',   my_sel.song_title,
        'artist',  my_sel.song_artist,
        'cover',   my_sel.song_cover,
        'preview', my_sel.song_preview
      ),
      'ready', my_sel.ready
    ) END,
    'opponent', CASE WHEN opp_sel IS NULL THEN NULL ELSE jsonb_build_object(
      'pack', jsonb_build_object(
        'id',          opp_sel.scenepack_id,
        'name',        opp_sel.scenepack_name,
        'poster',      opp_sel.scenepack_poster,
        'packCount',   opp_sel.scenepack_count,
        'youtubeUrl',  CASE WHEN reveal THEN opp_pack.scenepack_youtube_url ELSE NULL END,
        'gdriveUrl',   CASE WHEN reveal THEN opp_pack.scenepack_gdrive_url  ELSE NULL END,
        'previewUrl',  CASE WHEN reveal THEN opp_pack.preview_video_url     ELSE NULL END,
        'videoCount',  CASE WHEN reveal THEN (SELECT COUNT(*) FROM public.scenepack_videos WHERE scenepack_id::text = opp_sel.scenepack_id) ELSE 0 END
      ),
      'song', jsonb_build_object(
        'id',      opp_sel.song_id,
        'title',   opp_sel.song_title,
        'artist',  opp_sel.song_artist,
        'cover',   opp_sel.song_cover,
        'preview', opp_sel.song_preview
      ),
      'ready', opp_sel.ready
    ) END
  );
END;
$function$;
