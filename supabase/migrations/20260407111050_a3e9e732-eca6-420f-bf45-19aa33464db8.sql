ALTER TABLE public.cash_battles
  ADD COLUMN IF NOT EXISTS challenger_submission_url TEXT,
  ADD COLUMN IF NOT EXISTS challenger_submission_platform TEXT,
  ADD COLUMN IF NOT EXISTS challenger_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS opponent_submission_url TEXT,
  ADD COLUMN IF NOT EXISTS opponent_submission_platform TEXT,
  ADD COLUMN IF NOT EXISTS opponent_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scenepack_url TEXT;