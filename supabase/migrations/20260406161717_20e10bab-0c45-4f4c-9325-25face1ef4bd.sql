DROP POLICY "Anyone authenticated can read commission messages" ON public.commission_messages;

CREATE POLICY "Anyone can read commission messages"
ON public.commission_messages
FOR SELECT
TO anon, authenticated
USING (true);