CREATE POLICY "Anyone can delete client messages"
ON public.campaign_portal_messages FOR DELETE
USING (sender_type = 'client');