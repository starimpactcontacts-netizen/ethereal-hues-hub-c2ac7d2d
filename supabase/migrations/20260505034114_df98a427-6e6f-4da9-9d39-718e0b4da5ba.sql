ALTER TABLE public.quick_fights
  ADD COLUMN IF NOT EXISTS hidden_at timestamptz,
  ADD COLUMN IF NOT EXISTS hidden_by uuid;

CREATE INDEX IF NOT EXISTS idx_quick_fights_hidden_at ON public.quick_fights (hidden_at);

CREATE OR REPLACE FUNCTION public.toggle_quick_fight_hidden(p_fight_id uuid, p_hide boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_p1 uuid;
  v_p2 uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT player_1_id, player_2_id
    INTO v_p1, v_p2
  FROM public.quick_fights
  WHERE id = p_fight_id;

  IF v_p1 IS NULL THEN
    RAISE EXCEPTION 'Fight not found';
  END IF;

  IF v_uid <> v_p1 AND v_uid <> COALESCE(v_p2, '00000000-0000-0000-0000-000000000000'::uuid) THEN
    RAISE EXCEPTION 'Only fight participants can hide this fight';
  END IF;

  IF p_hide THEN
    UPDATE public.quick_fights
       SET hidden_at = now(), hidden_by = v_uid
     WHERE id = p_fight_id;
  ELSE
    UPDATE public.quick_fights
       SET hidden_at = NULL, hidden_by = NULL
     WHERE id = p_fight_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_quick_fight_hidden(uuid, boolean) TO authenticated;