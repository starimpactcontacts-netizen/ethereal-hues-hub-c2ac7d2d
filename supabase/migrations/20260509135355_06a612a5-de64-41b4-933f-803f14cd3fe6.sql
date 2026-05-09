
ALTER TABLE public.competitions
  ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS join_code text;

-- Tighten participant insert policy: private rooms can only be joined via RPC
DROP POLICY IF EXISTS "Authenticated users can join" ON public.competition_participants;
CREATE POLICY "Authenticated users can join"
ON public.competition_participants
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.competitions c
    WHERE c.id = competition_id
      AND (c.is_private = false OR c.creator_id = auth.uid())
  )
);

-- RPC for joining a private competition with code
CREATE OR REPLACE FUNCTION public.join_private_competition(
  p_competition_id uuid,
  p_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_comp record;
  v_username text;
  v_avatar text;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT id, is_private, join_code, creator_id, max_players, current_players, status
    INTO v_comp
    FROM public.competitions
    WHERE id = p_competition_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF v_comp.status NOT IN ('lobby', 'live') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'closed');
  END IF;

  IF v_comp.is_private = true
     AND v_comp.creator_id <> v_user
     AND (v_comp.join_code IS NULL OR upper(trim(p_code)) <> upper(trim(v_comp.join_code))) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
  END IF;

  IF v_comp.current_players >= v_comp.max_players THEN
    RETURN jsonb_build_object('ok', false, 'error', 'full');
  END IF;

  -- Already joined? idempotent success
  IF EXISTS (SELECT 1 FROM public.competition_participants
             WHERE competition_id = p_competition_id AND user_id = v_user) THEN
    RETURN jsonb_build_object('ok', true, 'already', true);
  END IF;

  SELECT username, avatar_url INTO v_username, v_avatar
    FROM public.profiles WHERE id = v_user;

  INSERT INTO public.competition_participants (competition_id, user_id, username, avatar_url)
  VALUES (p_competition_id, v_user, COALESCE(v_username, 'editor'), v_avatar);

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_private_competition(uuid, text) TO authenticated;
