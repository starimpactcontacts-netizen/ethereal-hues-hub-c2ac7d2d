-- Add label column to conversations for user-defined labels (client, friend, rival, etc.)
ALTER TABLE public.conversations 
ADD COLUMN label_1 TEXT DEFAULT NULL,
ADD COLUMN label_2 TEXT DEFAULT NULL;

-- Add comment to explain the columns
COMMENT ON COLUMN public.conversations.label_1 IS 'Custom label set by participant 1 for this conversation';
COMMENT ON COLUMN public.conversations.label_2 IS 'Custom label set by participant 2 for this conversation';

-- Allow users to delete their own conversations (soft delete by removing themselves)
CREATE POLICY "Users can delete their own conversations"
ON public.conversations
FOR DELETE
USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

-- Allow users to update labels on their conversations
CREATE POLICY "Users can update their conversation labels"
ON public.conversations
FOR UPDATE
USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id)
WITH CHECK (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);