-- Create invites table
CREATE TABLE public.invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invite_code TEXT NOT NULL UNIQUE,
  inviter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invitee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'joined', 'submitted')),
  invite_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  joined_at TIMESTAMP WITH TIME ZONE,
  first_submission_at TIMESTAMP WITH TIME ZONE,
  xp_awarded_send BOOLEAN DEFAULT false,
  xp_awarded_join BOOLEAN DEFAULT false,
  xp_awarded_submit BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Users can view their own sent invites
CREATE POLICY "Users can view their own invites"
ON public.invites FOR SELECT
USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

-- Users can create invites
CREATE POLICY "Users can create invites"
ON public.invites FOR INSERT
WITH CHECK (auth.uid() = inviter_id);

-- Users can update their own invites (for tracking)
CREATE POLICY "Users can update their own invites"
ON public.invites FOR UPDATE
USING (auth.uid() = inviter_id);

-- Create index for invite code lookups
CREATE INDEX idx_invites_code ON public.invites(invite_code);
CREATE INDEX idx_invites_inviter ON public.invites(inviter_id);
CREATE INDEX idx_invites_invitee ON public.invites(invitee_id);

-- Function to generate unique invite code
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Function to create an invite and award XP
CREATE OR REPLACE FUNCTION public.create_invite(p_user_id UUID)
RETURNS TABLE(invite_code TEXT, xp_awarded INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  result RECORD;
BEGIN
  -- Generate unique code
  LOOP
    new_code := public.generate_invite_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.invites WHERE invites.invite_code = new_code);
  END LOOP;
  
  -- Create invite
  INSERT INTO public.invites (invite_code, inviter_id, xp_awarded_send)
  VALUES (new_code, p_user_id, true);
  
  -- Award XP for sending invite
  PERFORM public.award_xp(p_user_id, 20, 'invite_sent', 'Sent an invite to a friend');
  
  RETURN QUERY SELECT new_code, 20;
END;
$$;

-- Function to redeem an invite code
CREATE OR REPLACE FUNCTION public.redeem_invite(p_user_id UUID, p_code TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT, inviter_xp INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record RECORD;
BEGIN
  -- Find the invite
  SELECT * INTO invite_record FROM public.invites WHERE invite_code = UPPER(p_code) AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Invalid or already used invite code'::TEXT, 0;
    RETURN;
  END IF;
  
  -- Can't use own invite
  IF invite_record.inviter_id = p_user_id THEN
    RETURN QUERY SELECT false, 'Cannot use your own invite code'::TEXT, 0;
    RETURN;
  END IF;
  
  -- Update invite
  UPDATE public.invites
  SET invitee_id = p_user_id,
      status = 'joined',
      joined_at = now(),
      xp_awarded_join = true,
      updated_at = now()
  WHERE id = invite_record.id;
  
  -- Award XP to inviter for successful join
  PERFORM public.award_xp(invite_record.inviter_id, 50, 'invite_joined', 'A friend joined using your invite');
  
  RETURN QUERY SELECT true, 'Welcome! Your friend earned XP for inviting you.'::TEXT, 50;
END;
$$;

-- Function to check and award submission bonus (call when user submits)
CREATE OR REPLACE FUNCTION public.check_invite_submission_bonus(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record RECORD;
  xp_awarded INTEGER := 0;
BEGIN
  -- Find invite where this user joined within 24 hours and hasn't triggered submit bonus
  SELECT * INTO invite_record 
  FROM public.invites 
  WHERE invitee_id = p_user_id 
    AND status = 'joined'
    AND xp_awarded_submit = false
    AND joined_at > now() - INTERVAL '24 hours';
  
  IF FOUND THEN
    -- Update invite
    UPDATE public.invites
    SET status = 'submitted',
        first_submission_at = now(),
        xp_awarded_submit = true,
        updated_at = now()
    WHERE id = invite_record.id;
    
    -- Award bonus XP to inviter
    PERFORM public.award_xp(invite_record.inviter_id, 100, 'invite_submitted', 'Your invited friend submitted within 24 hours!');
    xp_awarded := 100;
  END IF;
  
  RETURN xp_awarded;
END;
$$;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_invites_updated_at
BEFORE UPDATE ON public.invites
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();