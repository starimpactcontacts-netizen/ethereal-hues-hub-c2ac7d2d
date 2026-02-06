
-- League application system for Pro/Elite league promotions
CREATE TABLE public.league_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_league TEXT NOT NULL DEFAULT 'pro',
  current_wins INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_league, status)
);

ALTER TABLE public.league_applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
CREATE POLICY "Users can view own league applications"
  ON public.league_applications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create applications for themselves
CREATE POLICY "Users can create league applications"
  ON public.league_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all applications
CREATE POLICY "Admins can view all league applications"
  ON public.league_applications FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Admins can update applications (approve/reject)
CREATE POLICY "Admins can update league applications"
  ON public.league_applications FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Admins can delete applications
CREATE POLICY "Admins can delete league applications"
  ON public.league_applications FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Timestamp trigger
CREATE TRIGGER update_league_applications_updated_at
  BEFORE UPDATE ON public.league_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
