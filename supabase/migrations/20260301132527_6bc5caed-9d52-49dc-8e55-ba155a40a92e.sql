
-- Loopy chat conversations
CREATE TABLE public.loopy_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Chat',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Loopy chat messages
CREATE TABLE public.loopy_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.loopy_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loopy_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loopy_messages ENABLE ROW LEVEL SECURITY;

-- Users can only access their own conversations
CREATE POLICY "Users can view own conversations" ON public.loopy_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own conversations" ON public.loopy_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON public.loopy_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations" ON public.loopy_conversations FOR DELETE USING (auth.uid() = user_id);

-- Messages access through conversation ownership
CREATE POLICY "Users can view own messages" ON public.loopy_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.loopy_conversations WHERE id = conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create own messages" ON public.loopy_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.loopy_conversations WHERE id = conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete own messages" ON public.loopy_messages FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.loopy_conversations WHERE id = conversation_id AND user_id = auth.uid())
);

-- Indexes
CREATE INDEX idx_loopy_conversations_user ON public.loopy_conversations(user_id, updated_at DESC);
CREATE INDEX idx_loopy_messages_conversation ON public.loopy_messages(conversation_id, created_at ASC);
