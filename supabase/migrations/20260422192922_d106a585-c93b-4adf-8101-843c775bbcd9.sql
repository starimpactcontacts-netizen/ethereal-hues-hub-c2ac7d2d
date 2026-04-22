
-- Campaign portal chat: real conversations between campaign clients and Loopgate admins
CREATE TABLE public.campaign_portal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.artist_campaigns(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'admin')),
  sender_name TEXT,
  message_text TEXT NOT NULL,
  read_by_admin BOOLEAN NOT NULL DEFAULT false,
  read_by_client BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaign_portal_messages_campaign ON public.campaign_portal_messages(campaign_id, created_at DESC);

ALTER TABLE public.campaign_portal_messages ENABLE ROW LEVEL SECURITY;

-- Public can read & insert messages for any campaign (portal is public via slug; client identity is contextual).
-- Admins manage everything via has_role.
CREATE POLICY "Anyone can read campaign portal messages"
ON public.campaign_portal_messages FOR SELECT
USING (true);

CREATE POLICY "Anyone can post a client message"
ON public.campaign_portal_messages FOR INSERT
WITH CHECK (sender_type = 'client');

CREATE POLICY "Admins can post admin messages"
ON public.campaign_portal_messages FOR INSERT
TO authenticated
WITH CHECK (sender_type = 'admin' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update messages"
ON public.campaign_portal_messages FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete messages"
ON public.campaign_portal_messages FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_portal_messages;
ALTER TABLE public.campaign_portal_messages REPLICA IDENTITY FULL;
