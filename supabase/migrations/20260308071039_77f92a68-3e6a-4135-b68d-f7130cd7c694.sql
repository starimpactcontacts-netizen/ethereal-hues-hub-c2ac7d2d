
-- Standalone table for editorium-indexed edits (any source)
CREATE TABLE public.editorium_indexed_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  submission_url TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'tiktok',
  thumbnail_url TEXT,
  qoi_score NUMERIC,
  source TEXT NOT NULL DEFAULT 'manual',
  source_label TEXT,
  headline TEXT,
  featured_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  indexed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.editorium_indexed_edits ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can read indexed edits"
  ON public.editorium_indexed_edits FOR SELECT
  USING (true);

-- Only admins can insert/update/delete (via service role or has_role check)
CREATE POLICY "Admins can manage indexed edits"
  ON public.editorium_indexed_edits FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin'))
  );
