-- Add clipper role to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'clipper';

-- Create clipper_profiles table
CREATE TABLE IF NOT EXISTS public.clipper_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  agreed_to_terms BOOLEAN NOT NULL DEFAULT false,
  age_confirmed_18_plus BOOLEAN NOT NULL DEFAULT false,
  agreed_30_day_post BOOLEAN NOT NULL DEFAULT false,
  total_earnings_cents INTEGER NOT NULL DEFAULT 0,
  total_index_earned INTEGER NOT NULL DEFAULT 0,
  total_clips INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clipper_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own clipper profile"
ON public.clipper_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all clipper profiles"
ON public.clipper_profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'dev'::app_role));

CREATE POLICY "Users can create their own clipper profile"
ON public.clipper_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clipper profile"
ON public.clipper_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE TRIGGER update_clipper_profiles_updated_at
BEFORE UPDATE ON public.clipper_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();