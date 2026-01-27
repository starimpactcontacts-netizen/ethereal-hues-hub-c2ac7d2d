-- Create battle_invites table for tracking 1v1 battle requests
CREATE TABLE public.battle_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  battle_id UUID NOT NULL REFERENCES public.battles(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_username TEXT NOT NULL,
  sender_avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, declined, expired
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (battle_id, recipient_id)
);

-- Enable RLS
ALTER TABLE public.battle_invites ENABLE ROW LEVEL SECURITY;

-- Anyone can view invites they sent or received
CREATE POLICY "Users can view their invites"
ON public.battle_invites
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Authenticated users can create invites for battles they own
CREATE POLICY "Challengers can send battle invites"
ON public.battle_invites
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.battles 
    WHERE id = battle_id 
    AND challenger_id = auth.uid()
    AND status = 'pending'
    AND opponent_id IS NULL
  )
);

-- Recipients can update invite status (accept/decline)
CREATE POLICY "Recipients can respond to invites"
ON public.battle_invites
FOR UPDATE
USING (auth.uid() = recipient_id);

-- Senders can delete their pending invites
CREATE POLICY "Senders can cancel pending invites"
ON public.battle_invites
FOR DELETE
USING (auth.uid() = sender_id AND status = 'pending');

-- Enable realtime for battle_invites
ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_invites;

-- Create function to send battle invite notification
CREATE OR REPLACE FUNCTION public.notify_battle_invite()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    NEW.recipient_id,
    'battle_invite',
    '⚔️ 1v1 Challenge!',
    NEW.sender_username || ' wants to 1v1 you in the Arena!',
    jsonb_build_object('battle_id', NEW.battle_id, 'invite_id', NEW.id, 'sender_username', NEW.sender_username)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for battle invite notifications
CREATE TRIGGER on_battle_invite_created
AFTER INSERT ON public.battle_invites
FOR EACH ROW
EXECUTE FUNCTION public.notify_battle_invite();