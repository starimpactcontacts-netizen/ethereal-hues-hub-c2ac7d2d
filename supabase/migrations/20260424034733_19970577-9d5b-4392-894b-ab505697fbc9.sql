-- Create support_ticket_messages for real chat threads
CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  sender_role text NOT NULL DEFAULT 'user', -- 'user' | 'admin'
  message text NOT NULL,
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket ON public.support_ticket_messages(ticket_id, created_at);

ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- Ticket owner can view messages on their own ticket
CREATE POLICY "Ticket owner can view messages"
ON public.support_ticket_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = support_ticket_messages.ticket_id
      AND t.user_id = auth.uid()
  )
);

-- Admins can view all messages
CREATE POLICY "Admins can view all ticket messages"
ON public.support_ticket_messages FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Ticket owner can post messages on their ticket as 'user'
CREATE POLICY "Ticket owner can send messages"
ON public.support_ticket_messages FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND sender_role = 'user'
  AND EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = support_ticket_messages.ticket_id
      AND t.user_id = auth.uid()
  )
);

-- Admins can post messages as 'admin'
CREATE POLICY "Admins can send messages"
ON public.support_ticket_messages FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  AND sender_role = 'admin'
  AND auth.uid() = user_id
);

-- Bump ticket updated_at when a new message arrives
CREATE OR REPLACE FUNCTION public.bump_ticket_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.support_tickets
  SET updated_at = now(),
      status = CASE
        WHEN NEW.sender_role = 'user' AND status = 'closed' THEN 'open'
        ELSE status
      END
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bump_ticket_on_message ON public.support_ticket_messages;
CREATE TRIGGER trg_bump_ticket_on_message
AFTER INSERT ON public.support_ticket_messages
FOR EACH ROW EXECUTE FUNCTION public.bump_ticket_on_message();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_ticket_messages;
ALTER TABLE public.support_ticket_messages REPLICA IDENTITY FULL;