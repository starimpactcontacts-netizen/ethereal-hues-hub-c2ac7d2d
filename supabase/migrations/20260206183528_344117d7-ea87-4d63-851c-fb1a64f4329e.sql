-- Add media_type column to unit_logo_previews
ALTER TABLE public.unit_logo_previews 
ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image';