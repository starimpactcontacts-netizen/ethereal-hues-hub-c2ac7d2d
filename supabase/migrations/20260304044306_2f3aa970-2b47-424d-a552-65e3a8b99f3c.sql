
-- Add rating and earned_cents to commission_submissions
ALTER TABLE public.commission_submissions
ADD COLUMN rating text DEFAULT NULL,
ADD COLUMN earned_cents integer NOT NULL DEFAULT 0;

-- Add earnings tracking to profiles
ALTER TABLE public.profiles
ADD COLUMN earnings_cents integer NOT NULL DEFAULT 0,
ADD COLUMN pending_withdrawal_cents integer NOT NULL DEFAULT 0,
ADD COLUMN withdrawn_cents integer NOT NULL DEFAULT 0;

-- Create payout_requests table
CREATE TABLE public.payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  username text NOT NULL,
  avatar_url text,
  paypal_email text NOT NULL,
  amount_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

-- Users can see their own payout requests
CREATE POLICY "Users can view own payout requests"
ON public.payout_requests FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create their own payout requests
CREATE POLICY "Users can create own payout requests"
ON public.payout_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admin/dev can view all payout requests
CREATE POLICY "Staff can view all payout requests"
ON public.payout_requests FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

-- Admin/dev can update payout requests (approve/reject)
CREATE POLICY "Staff can update payout requests"
ON public.payout_requests FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

-- Trigger: when commission_submission gets rated, update profile earnings
CREATE OR REPLACE FUNCTION public.award_commission_earnings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a submission gets rated with earnings
  IF NEW.earned_cents > 0 AND (OLD.earned_cents IS NULL OR OLD.earned_cents = 0) THEN
    UPDATE public.profiles
    SET earnings_cents = earnings_cents + NEW.earned_cents
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_commission_submission_rated
BEFORE UPDATE ON public.commission_submissions
FOR EACH ROW
EXECUTE FUNCTION public.award_commission_earnings();

-- Enable realtime for payout_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.payout_requests;
