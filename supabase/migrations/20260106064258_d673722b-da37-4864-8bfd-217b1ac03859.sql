-- Create arena_messages table for real-time chat
CREATE TABLE public.arena_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  arena_id INTEGER NOT NULL CHECK (arena_id BETWEEN 1 AND 4),
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.arena_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view arena messages"
ON public.arena_messages
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can send messages"
ON public.arena_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries by arena
CREATE INDEX idx_arena_messages_arena_id ON public.arena_messages(arena_id);
CREATE INDEX idx_arena_messages_created_at ON public.arena_messages(created_at DESC);

-- Enable realtime for arena_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.arena_messages;