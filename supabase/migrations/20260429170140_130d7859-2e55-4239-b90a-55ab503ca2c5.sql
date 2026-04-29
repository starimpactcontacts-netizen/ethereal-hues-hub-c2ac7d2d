ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rings INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_profiles_rings ON public.profiles(rings);