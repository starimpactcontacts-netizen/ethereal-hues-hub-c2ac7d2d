-- Add discord_url and is_featured columns to crews table
ALTER TABLE public.crews 
ADD COLUMN IF NOT EXISTS discord_url TEXT,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS featured_at TIMESTAMP WITH TIME ZONE;

-- Create index for featured crews
CREATE INDEX IF NOT EXISTS idx_crews_featured ON public.crews(is_featured, featured_at DESC) WHERE is_featured = true;