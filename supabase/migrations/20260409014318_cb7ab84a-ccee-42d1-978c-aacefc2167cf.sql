
ALTER TABLE public.cash_battles
  ADD COLUMN IF NOT EXISTS scenepack_youtube_url text,
  ADD COLUMN IF NOT EXISTS scenepack_gdrive_url text;

ALTER TABLE public.commissions
  ADD COLUMN IF NOT EXISTS scenepack_youtube_url text,
  ADD COLUMN IF NOT EXISTS scenepack_gdrive_url text;
