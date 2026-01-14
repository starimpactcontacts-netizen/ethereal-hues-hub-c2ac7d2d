-- Update create_invite function to support custom codes
CREATE OR REPLACE FUNCTION public.create_invite(p_user_id uuid, p_custom_code text DEFAULT NULL)
 RETURNS TABLE(invite_code text, xp_awarded integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_code TEXT;
  result RECORD;
BEGIN
  -- Use custom code if provided, otherwise generate random
  IF p_custom_code IS NOT NULL AND LENGTH(TRIM(p_custom_code)) >= 4 THEN
    new_code := UPPER(TRIM(p_custom_code));
    
    -- Check if custom code already exists
    IF EXISTS (SELECT 1 FROM public.invites WHERE invites.invite_code = new_code) THEN
      RAISE EXCEPTION 'Code already taken';
    END IF;
  ELSE
    -- Generate unique random code
    LOOP
      new_code := public.generate_invite_code();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.invites WHERE invites.invite_code = new_code);
    END LOOP;
  END IF;
  
  -- Create invite
  INSERT INTO public.invites (invite_code, inviter_id, xp_awarded_send)
  VALUES (new_code, p_user_id, true);
  
  -- Award XP for sending invite
  PERFORM public.award_xp(p_user_id, 20, 'invite_sent', 'Sent an invite to a friend');
  
  RETURN QUERY SELECT new_code, 20;
END;
$function$;