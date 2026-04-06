-- Drop the partial unique index that doesn't work for upserts
DROP INDEX IF EXISTS idx_lobby_presence_user_commission;

-- Add a proper unique constraint
ALTER TABLE public.mission_lobby_presence
ADD CONSTRAINT mission_lobby_presence_user_commission_key UNIQUE (user_id, commission_id);