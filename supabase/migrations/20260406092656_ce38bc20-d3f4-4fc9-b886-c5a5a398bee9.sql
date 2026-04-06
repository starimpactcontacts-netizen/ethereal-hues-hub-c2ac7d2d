
-- Add unique constraint for commission-based presence upserts
CREATE UNIQUE INDEX IF NOT EXISTS idx_lobby_presence_user_commission 
ON public.mission_lobby_presence (user_id, commission_id) 
WHERE commission_id IS NOT NULL;
