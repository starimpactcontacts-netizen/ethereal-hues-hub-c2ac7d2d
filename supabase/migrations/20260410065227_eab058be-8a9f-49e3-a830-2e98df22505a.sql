-- Add reply fields to direct_messages
ALTER TABLE public.direct_messages
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.direct_messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS reply_to_text TEXT,
ADD COLUMN IF NOT EXISTS reply_to_sender_id UUID;

-- Create typing status table
CREATE TABLE public.dm_typing_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

ALTER TABLE public.dm_typing_status ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can see typing status for their conversations
CREATE POLICY "Users can view typing in their conversations"
ON public.dm_typing_status
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
  )
);

-- Users can manage their own typing status
CREATE POLICY "Users can insert their own typing status"
ON public.dm_typing_status
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own typing status"
ON public.dm_typing_status
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own typing status"
ON public.dm_typing_status
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Enable realtime for typing status
ALTER PUBLICATION supabase_realtime ADD TABLE public.dm_typing_status;