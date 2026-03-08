
-- Table to track which edits a user has hidden from public view
-- The edit stays in the system but won't show on their public profile
CREATE TABLE public.hidden_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  source TEXT NOT NULL, -- 'standard', 'round', 'sanctioned', 'featured', 'battle'
  source_id UUID NOT NULL, -- ID in the source table
  hidden_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, source, source_id)
);

ALTER TABLE public.hidden_edits ENABLE ROW LEVEL SECURITY;

-- Users can see their own hidden edits
CREATE POLICY "Users can view own hidden edits"
  ON public.hidden_edits FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can hide their own edits
CREATE POLICY "Users can hide own edits"
  ON public.hidden_edits FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can unhide their own edits
CREATE POLICY "Users can unhide own edits"
  ON public.hidden_edits FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
