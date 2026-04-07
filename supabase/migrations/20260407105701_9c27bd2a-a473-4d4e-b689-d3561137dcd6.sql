
ALTER TABLE public.cash_battles
  ADD COLUMN sponsor_name text,
  ADD COLUMN sponsor_logo_url text,
  ADD COLUMN sponsor_campaign_id uuid REFERENCES public.artist_campaigns(id),
  ADD COLUMN challenger_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN opponent_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN challenger_accepted_at timestamptz,
  ADD COLUMN opponent_accepted_at timestamptz;
