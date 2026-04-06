
-- Add commission_id column to mission_lobby_presence for commission-based missions
ALTER TABLE public.mission_lobby_presence ADD COLUMN IF NOT EXISTS commission_id uuid;

-- Allow either drop_id or commission_id to be set
CREATE INDEX IF NOT EXISTS idx_lobby_presence_commission ON public.mission_lobby_presence (commission_id) WHERE commission_id IS NOT NULL;

-- Make drop_id nullable since commissions use commission_id
ALTER TABLE public.mission_lobby_presence ALTER COLUMN drop_id DROP NOT NULL;
