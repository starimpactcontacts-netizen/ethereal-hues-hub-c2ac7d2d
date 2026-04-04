
-- Make song_name truly optional (it already allows null, just ensuring)
ALTER TABLE public.hosted_competitions 
  ADD COLUMN IF NOT EXISTS cash_prize_cents integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reward_type text DEFAULT 'index',
  ADD COLUMN IF NOT EXISTS prize_distribution jsonb DEFAULT null;

-- prize_distribution example: [{"rank":1,"index":300,"cash_cents":5000},{"rank":2,"index":150},{"rank":3,"index":50}]
