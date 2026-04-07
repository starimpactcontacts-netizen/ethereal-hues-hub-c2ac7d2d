
-- Cash battle applications table
CREATE TABLE public.cash_battle_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  tiktok_url TEXT,
  instagram_url TEXT,
  youtube_url TEXT,
  demo_reel_url TEXT NOT NULL,
  pitch TEXT,
  agreed_to_terms BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  matched_battle_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cash_battle_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own applications"
  ON public.cash_battle_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications"
  ON public.cash_battle_applications FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create own applications"
  ON public.cash_battle_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id AND agreed_to_terms = true);

CREATE POLICY "Admins can update applications"
  ON public.cash_battle_applications FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_cash_battle_applications_updated_at
  BEFORE UPDATE ON public.cash_battle_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Cash battles table (admin-curated matches)
CREATE TABLE public.cash_battles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_id UUID NOT NULL,
  challenger_username TEXT NOT NULL,
  challenger_avatar_url TEXT,
  opponent_id UUID,
  opponent_username TEXT,
  opponent_avatar_url TEXT,
  prize_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'upcoming',
  duration_hours INTEGER NOT NULL DEFAULT 24,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  winner_id UUID,
  created_by UUID,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cash_battles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cash battles"
  ON public.cash_battles FOR SELECT
  USING (true);

CREATE POLICY "Admins can create cash battles"
  ON public.cash_battles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update cash battles"
  ON public.cash_battles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_cash_battles_updated_at
  BEFORE UPDATE ON public.cash_battles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
