
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  category TEXT NOT NULL DEFAULT 'bug',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  admin_reply TEXT,
  replied_by TEXT,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own tickets"
ON public.support_tickets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own tickets"
ON public.support_tickets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tickets"
ON public.support_tickets FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all tickets"
ON public.support_tickets FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_support_tickets_user ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
