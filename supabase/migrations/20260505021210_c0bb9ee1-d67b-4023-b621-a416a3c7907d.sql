-- Allow battle participants to hide a battle from public carousels
-- Stats remain intact; the battle row stays in the database.

ALTER TABLE public.battles
  ADD COLUMN IF NOT EXISTS hidden_at timestamptz,
  ADD COLUMN IF NOT EXISTS hidden_by uuid;

CREATE INDEX IF NOT EXISTS idx_battles_hidden_at ON public.battles (hidden_at);

-- RPC so a participant can hide / unhide their battle even if RLS UPDATE is restricted
CREATE OR REPLACE FUNCTION public.toggle_battle_hidden(p_battle_id uuid, p_hide boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_challenger uuid;
  v_opponent uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT challenger_id, opponent_id
    INTO v_challenger, v_opponent
  FROM public.battles
  WHERE id = p_battle_id;

  IF v_challenger IS NULL THEN
    RAISE EXCEPTION 'Battle not found';
  END IF;

  IF v_uid <> v_challenger AND v_uid <> COALESCE(v_opponent, '00000000-0000-0000-0000-000000000000'::uuid) THEN
    RAISE EXCEPTION 'Only battle participants can hide this battle';
  END IF;

  IF p_hide THEN
    UPDATE public.battles
       SET hidden_at = now(), hidden_by = v_uid
     WHERE id = p_battle_id;
  ELSE
    -- Only the user who hid it (or the other participant) may unhide
    UPDATE public.battles
       SET hidden_at = NULL, hidden_by = NULL
     WHERE id = p_battle_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_battle_hidden(uuid, boolean) TO authenticated;