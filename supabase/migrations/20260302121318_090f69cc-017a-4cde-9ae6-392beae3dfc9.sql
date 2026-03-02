
-- Commissions table (admin posts paid editing jobs)
CREATE TABLE public.commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  title text NOT NULL,
  description text,
  song_name text,
  artist_name text,
  payout_cents integer NOT NULL DEFAULT 0,
  max_slots integer NOT NULL DEFAULT 3,
  status text NOT NULL DEFAULT 'open',
  deadline timestamptz,
  thumbnail_url text,
  submission_count integer NOT NULL DEFAULT 0,
  accepted_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Commission submissions (editors submit their work)
CREATE TABLE public.commission_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id uuid NOT NULL REFERENCES public.commissions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  username text NOT NULL,
  avatar_url text,
  submission_url text NOT NULL,
  platform text,
  message text,
  status text NOT NULL DEFAULT 'pending',
  feedback text,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique: one submission per user per commission
ALTER TABLE public.commission_submissions ADD CONSTRAINT commission_submissions_unique_user UNIQUE (commission_id, user_id);

-- Enable RLS
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_submissions ENABLE ROW LEVEL SECURITY;

-- Commissions: anyone can read, only admin/dev can write
CREATE POLICY "Anyone can view commissions"
ON public.commissions FOR SELECT USING (true);

CREATE POLICY "Admin can insert commissions"
ON public.commissions FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'dev') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update commissions"
ON public.commissions FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'dev') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete commissions"
ON public.commissions FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'dev') OR public.has_role(auth.uid(), 'admin'));

-- Commission submissions: anyone can read, authenticated can insert own, admin can update
CREATE POLICY "Anyone can view submissions"
ON public.commission_submissions FOR SELECT USING (true);

CREATE POLICY "Authenticated users can submit"
ON public.commission_submissions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can update submissions"
ON public.commission_submissions FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'dev') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own pending submissions"
ON public.commission_submissions FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending');

-- Trigger to sync submission_count and accepted_count on commissions
CREATE OR REPLACE FUNCTION public.sync_commission_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id uuid;
BEGIN
  target_id := COALESCE(NEW.commission_id, OLD.commission_id);
  
  UPDATE public.commissions
  SET submission_count = (SELECT COUNT(*) FROM public.commission_submissions WHERE commission_id = target_id),
      accepted_count = (SELECT COUNT(*) FROM public.commission_submissions WHERE commission_id = target_id AND status = 'accepted')
  WHERE id = target_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER sync_commission_counts_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.commission_submissions
FOR EACH ROW EXECUTE FUNCTION public.sync_commission_counts();

-- Auto-close commission when accepted_count reaches max_slots
CREATE OR REPLACE FUNCTION public.auto_close_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.accepted_count >= NEW.max_slots AND NEW.status = 'open' THEN
    NEW.status := 'filled';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_close_commission_trigger
BEFORE UPDATE ON public.commissions
FOR EACH ROW EXECUTE FUNCTION public.auto_close_commission();
