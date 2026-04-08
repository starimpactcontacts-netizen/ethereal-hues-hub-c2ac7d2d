
CREATE OR REPLACE FUNCTION public.auto_matchmake_cash_battle()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  other_app RECORD;
  new_battle_id uuid;
  now_ts timestamptz := now();
BEGIN
  -- Only act on pending applications
  IF NEW.status != 'pending' THEN
    RETURN NEW;
  END IF;

  -- Find the oldest other pending application (not this user)
  SELECT * INTO other_app
  FROM cash_battle_applications
  WHERE status = 'pending'
    AND user_id != NEW.user_id
    AND id != NEW.id
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  -- If no match found, leave this one pending
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Create a live battle instantly
  INSERT INTO cash_battles (
    challenger_id, challenger_username, challenger_avatar_url,
    opponent_id, opponent_username, opponent_avatar_url,
    duration_hours, status, starts_at, ends_at,
    challenger_accepted, opponent_accepted,
    challenger_accepted_at, opponent_accepted_at
  ) VALUES (
    other_app.user_id, other_app.username, other_app.avatar_url,
    NEW.user_id, NEW.username, NEW.avatar_url,
    24, 'live', now_ts, now_ts + interval '24 hours',
    true, true, now_ts, now_ts
  )
  RETURNING id INTO new_battle_id;

  -- Mark both applications as matched
  UPDATE cash_battle_applications
  SET status = 'matched', matched_battle_id = new_battle_id
  WHERE id = other_app.id;

  -- Mark the current (NEW) application as matched too
  NEW.status := 'matched';
  NEW.matched_battle_id := new_battle_id;

  RETURN NEW;
END;
$$;

-- Drop if exists to avoid duplicates
DROP TRIGGER IF EXISTS trg_auto_matchmake_cash_battle ON cash_battle_applications;

CREATE TRIGGER trg_auto_matchmake_cash_battle
  BEFORE INSERT OR UPDATE ON cash_battle_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_matchmake_cash_battle();
