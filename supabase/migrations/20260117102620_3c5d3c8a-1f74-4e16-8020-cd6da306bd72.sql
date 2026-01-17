CREATE OR REPLACE FUNCTION public.advance_round_participants(p_event_id uuid, p_round_number integer, p_advancement_type advancement_type, p_advancement_value integer DEFAULT NULL::integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  advanced_count INTEGER := 0;
  threshold_val NUMERIC;
  index_reward_val INTEGER;
  user_record RECORD;
BEGIN
  -- Get round config including index reward
  SELECT threshold_qoi, index_reward INTO threshold_val, index_reward_val
  FROM public.event_rounds
  WHERE event_id = p_event_id AND round_number = p_round_number;

  IF p_advancement_type = 'top_x' THEN
    -- Advance top X by QOI score
    WITH ranked AS (
      SELECT id, user_id, ROW_NUMBER() OVER (ORDER BY qoi_score DESC NULLS LAST) as rank
      FROM public.round_participations
      WHERE event_id = p_event_id AND round_number = p_round_number AND status = 'active'
    )
    UPDATE public.round_participations rp
    SET status = CASE 
      WHEN r.rank <= p_advancement_value THEN 'advanced'::participant_status 
      ELSE 'eliminated'::participant_status 
    END
    FROM ranked r
    WHERE rp.id = r.id;
    
    GET DIAGNOSTICS advanced_count = ROW_COUNT;
    
  ELSIF p_advancement_type = 'percentage' THEN
    -- Advance top X%
    WITH ranked AS (
      SELECT id, user_id,
             ROW_NUMBER() OVER (ORDER BY qoi_score DESC NULLS LAST) as rank,
             COUNT(*) OVER () as total
      FROM public.round_participations
      WHERE event_id = p_event_id AND round_number = p_round_number AND status = 'active'
    )
    UPDATE public.round_participations rp
    SET status = CASE 
      WHEN r.rank <= CEIL(r.total * p_advancement_value / 100.0) THEN 'advanced'::participant_status 
      ELSE 'eliminated'::participant_status 
    END
    FROM ranked r
    WHERE rp.id = r.id;
    
    GET DIAGNOSTICS advanced_count = ROW_COUNT;
    
  ELSIF p_advancement_type = 'none' THEN
    -- Open round - everyone advances
    UPDATE public.round_participations
    SET status = 'advanced'
    WHERE event_id = p_event_id AND round_number = p_round_number AND status = 'active';
    
    GET DIAGNOSTICS advanced_count = ROW_COUNT;
  END IF;

  -- Award index points to advanced users if index_reward is set
  IF COALESCE(index_reward_val, 0) > 0 THEN
    UPDATE public.profiles p
    SET spendable_index = spendable_index + index_reward_val,
        global_index_score = COALESCE(global_index_score, 0) + index_reward_val
    FROM public.round_participations rp
    WHERE rp.user_id = p.id
      AND rp.event_id = p_event_id
      AND rp.round_number = p_round_number
      AND rp.status = 'advanced';
  END IF;

  -- Create entries for next round for advanced users
  IF p_round_number < 3 THEN
    INSERT INTO public.round_participations (user_id, event_id, round_number, status, cumulative_qoi)
    SELECT user_id, event_id, p_round_number + 1, 'pending', 
           COALESCE(cumulative_qoi, 0) + COALESCE(qoi_score, 0)
    FROM public.round_participations
    WHERE event_id = p_event_id AND round_number = p_round_number AND status = 'advanced'
    ON CONFLICT (user_id, event_id, round_number) DO NOTHING;
  END IF;

  RETURN advanced_count;
END;
$function$;