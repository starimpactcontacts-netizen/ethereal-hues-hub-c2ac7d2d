-- The chat now ships a delete button for a user's own quick-fight messages,
-- but quick_fight_messages only had SELECT/INSERT policies — DELETE was
-- silently denied by RLS. Let authenticated users delete their own messages.
CREATE POLICY "Users can delete their own quick fight messages"
  ON public.quick_fight_messages FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Realtime DELETE payloads only carry the primary key by default, so the
-- client's `fight_id=eq.<id>` filter can't match the old row and the event
-- never arrives. REPLICA IDENTITY FULL includes the full old row, letting
-- deletions broadcast to (and disappear for) everyone in the lobby live.
ALTER TABLE public.quick_fight_messages REPLICA IDENTITY FULL;
