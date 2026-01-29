-- Create hosted_comp_messages table for competition chat
CREATE TABLE IF NOT EXISTS public.hosted_comp_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES public.hosted_competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hosted_comp_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can read messages
CREATE POLICY "Anyone can read comp messages"
ON public.hosted_comp_messages FOR SELECT
USING (true);

-- Authenticated users can insert their own messages
CREATE POLICY "Users can send messages"
ON public.hosted_comp_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own messages within 5 minutes
CREATE POLICY "Users can delete own recent messages"
ON public.hosted_comp_messages FOR DELETE
USING (
  auth.uid() = user_id 
  AND created_at > now() - INTERVAL '5 minutes'
);

-- Apply profanity filter trigger
CREATE TRIGGER filter_hosted_comp_message_profanity
  BEFORE INSERT ON public.hosted_comp_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.filter_message_profanity();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.hosted_comp_messages;

-- Index for performance
CREATE INDEX idx_hosted_comp_messages_comp_id ON public.hosted_comp_messages(competition_id);
CREATE INDEX idx_hosted_comp_messages_created ON public.hosted_comp_messages(created_at);