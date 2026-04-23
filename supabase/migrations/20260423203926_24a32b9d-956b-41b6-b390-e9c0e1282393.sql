-- Clip submissions
CREATE TABLE IF NOT EXISTS public.clip_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.artist_campaigns(id) ON DELETE SET NULL,
  campaign_name text,
  title text,
  video_url text NOT NULL,
  thumbnail_url text,
  platform text,
  posted_account_handle text,
  view_count integer NOT NULL DEFAULT 0,
  like_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | rejected | paid
  earned_cents integer NOT NULL DEFAULT 0,
  index_earned integer NOT NULL DEFAULT 0,
  feedback text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.clip_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clippers view own submissions"
  ON public.clip_submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Clippers create own submissions"
  ON public.clip_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Clippers update own submissions"
  ON public.clip_submissions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Clippers delete own submissions"
  ON public.clip_submissions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all submissions"
  ON public.clip_submissions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update all submissions"
  ON public.clip_submissions FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_clip_submissions_user ON public.clip_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_clip_submissions_campaign ON public.clip_submissions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_clip_submissions_status ON public.clip_submissions(status);

CREATE TRIGGER trg_clip_submissions_updated
  BEFORE UPDATE ON public.clip_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Linked accounts
CREATE TABLE IF NOT EXISTS public.clipper_linked_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL, -- tiktok | instagram | youtube | x | facebook
  handle text NOT NULL,
  profile_url text,
  follower_count integer DEFAULT 0,
  is_verified boolean NOT NULL DEFAULT false,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform, handle)
);

ALTER TABLE public.clipper_linked_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clippers view own linked accounts"
  ON public.clipper_linked_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Clippers manage own linked accounts"
  ON public.clipper_linked_accounts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_clipper_linked_user ON public.clipper_linked_accounts(user_id);

-- Withdrawals
CREATE TABLE IF NOT EXISTS public.clipper_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  method text NOT NULL, -- paypal | bank | crypto
  destination text NOT NULL, -- email, account number, wallet address
  status text NOT NULL DEFAULT 'pending', -- pending | processing | paid | rejected
  admin_notes text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.clipper_withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clippers view own withdrawals"
  ON public.clipper_withdrawals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Clippers create own withdrawals"
  ON public.clipper_withdrawals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all withdrawals"
  ON public.clipper_withdrawals FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update all withdrawals"
  ON public.clipper_withdrawals FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_clipper_withdrawals_user ON public.clipper_withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_clipper_withdrawals_status ON public.clipper_withdrawals(status);

CREATE TRIGGER trg_clipper_withdrawals_updated
  BEFORE UPDATE ON public.clipper_withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();