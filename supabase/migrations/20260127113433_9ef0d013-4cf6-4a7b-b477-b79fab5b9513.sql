-- Create tournament_messages table for in-event chat
CREATE TABLE public.tournament_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.sanctioned_tournaments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  username text NOT NULL,
  avatar_url text,
  message_text text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tournament_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can view messages in tournaments
CREATE POLICY "Anyone can view tournament messages"
ON public.tournament_messages
FOR SELECT
USING (true);

-- Authenticated users can send messages
CREATE POLICY "Authenticated users can send messages"
ON public.tournament_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete own messages within 5 minutes
CREATE POLICY "Users can delete own messages within 5 minutes"
ON public.tournament_messages
FOR DELETE
USING (auth.uid() = user_id AND created_at > now() - interval '5 minutes');

-- Authority can delete any message
CREATE POLICY "Authority can delete tournament messages"
ON public.tournament_messages
FOR DELETE
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'judge') OR 
  has_role(auth.uid(), 'dev')
);

-- Create indexes for faster queries
CREATE INDEX idx_tournament_messages_tournament_id ON public.tournament_messages(tournament_id);
CREATE INDEX idx_tournament_messages_created_at ON public.tournament_messages(created_at);

-- Enable realtime for tournament messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_messages;

-- Add profanity filter trigger using the existing function
CREATE TRIGGER filter_tournament_message_profanity
BEFORE INSERT ON public.tournament_messages
FOR EACH ROW
EXECUTE FUNCTION filter_message_profanity();