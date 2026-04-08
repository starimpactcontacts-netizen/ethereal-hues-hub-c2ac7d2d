ALTER TABLE public.cash_battles 
ADD COLUMN viral_bonus_cents integer NOT NULL DEFAULT 5000,
ADD COLUMN viral_bonus_threshold_views integer NOT NULL DEFAULT 100000,
ADD COLUMN viral_bonus_awarded boolean NOT NULL DEFAULT false;