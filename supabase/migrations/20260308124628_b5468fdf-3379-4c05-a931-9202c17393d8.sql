
CREATE TABLE public.loopy_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  submission_url TEXT NOT NULL,
  platform TEXT,
  emotion_score INTEGER DEFAULT 0,
  creativity_score INTEGER DEFAULT 0,
  sync_score INTEGER DEFAULT 0,
  identity_score INTEGER DEFAULT 0,
  execution_score INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  grade TEXT,
  strengths TEXT[] DEFAULT '{}',
  improvements TEXT[] DEFAULT '{}',
  vibe_check TEXT,
  detailed_feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.loopy_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own ratings" ON public.loopy_ratings
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own ratings" ON public.loopy_ratings
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_loopy_ratings_user ON public.loopy_ratings(user_id, created_at DESC);
