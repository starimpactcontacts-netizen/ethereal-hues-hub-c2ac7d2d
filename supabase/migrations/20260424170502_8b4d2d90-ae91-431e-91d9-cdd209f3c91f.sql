ALTER TABLE public.clipper_linked_accounts
  ADD COLUMN IF NOT EXISTS verification_code text,
  ADD COLUMN IF NOT EXISTS code_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS stats_fetched_at timestamptz;