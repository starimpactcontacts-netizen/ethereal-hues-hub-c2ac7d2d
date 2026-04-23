ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS cap_type text NOT NULL DEFAULT 'budget',
  ADD COLUMN IF NOT EXISTS max_posts integer;