
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS daily_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_daily_claim_at date;

CREATE OR REPLACE FUNCTION public.claim_daily_reward()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  last_claim date;
  streak int;
  new_day int;
  reward_kind text;
  reward_amount int;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT last_daily_claim_at, daily_streak
    INTO last_claim, streak
  FROM public.profiles
  WHERE id = uid
  FOR UPDATE;

  IF last_claim = CURRENT_DATE THEN
    RETURN jsonb_build_object(
      'already_claimed', true,
      'day', ((streak - 1) % 7) + 1,
      'streak', streak
    );
  END IF;

  -- Determine new streak: continue if yesterday, otherwise reset
  IF last_claim = CURRENT_DATE - 1 THEN
    streak := COALESCE(streak, 0) + 1;
  ELSE
    streak := 1;
  END IF;

  new_day := ((streak - 1) % 7) + 1; -- 1..7 cycle

  IF new_day = 4 THEN
    reward_kind := 'rings';
    reward_amount := 50;
  ELSIF new_day = 7 THEN
    reward_kind := 'rings';
    reward_amount := 200;
  ELSE
    reward_kind := 'xp';
    reward_amount := 50 + (new_day - 1) * 100; -- 50,150,250,_,450,550
  END IF;

  IF reward_kind = 'xp' THEN
    UPDATE public.profiles
      SET xp = xp + reward_amount,
          daily_streak = streak,
          last_daily_claim_at = CURRENT_DATE,
          updated_at = now()
    WHERE id = uid;
  ELSE
    UPDATE public.profiles
      SET rings = rings + reward_amount,
          daily_streak = streak,
          last_daily_claim_at = CURRENT_DATE,
          updated_at = now()
    WHERE id = uid;
  END IF;

  RETURN jsonb_build_object(
    'already_claimed', false,
    'day', new_day,
    'streak', streak,
    'reward_kind', reward_kind,
    'reward_amount', reward_amount
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_daily_reward() TO authenticated;
