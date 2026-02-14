
-- Pinned edits: editors can showcase up to 3 of their best edits
CREATE TABLE public.pinned_edits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  platform TEXT NOT NULL DEFAULT 'tiktok',
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  pin_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Max 3 per user enforced at app level, unique url per user
  UNIQUE(user_id, url)
);

-- Enable RLS
ALTER TABLE public.pinned_edits ENABLE ROW LEVEL SECURITY;

-- Anyone can view pinned edits (they're public showcase)
CREATE POLICY "Pinned edits are publicly viewable"
ON public.pinned_edits FOR SELECT
USING (true);

-- Users can manage their own pinned edits
CREATE POLICY "Users can insert their own pinned edits"
ON public.pinned_edits FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pinned edits"
ON public.pinned_edits FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pinned edits"
ON public.pinned_edits FOR DELETE
USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_pinned_edits_user_id ON public.pinned_edits(user_id, pin_order);
