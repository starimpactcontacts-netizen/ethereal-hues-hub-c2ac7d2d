-- Add banner customization columns to crews table
ALTER TABLE public.crews ADD COLUMN IF NOT EXISTS banner_url text;
ALTER TABLE public.crews ADD COLUMN IF NOT EXISTS banner_color text DEFAULT '#d4af37';