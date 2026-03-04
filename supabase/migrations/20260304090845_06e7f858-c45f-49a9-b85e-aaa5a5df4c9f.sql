
-- Add paypal_email to profiles so users can save their payout method
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS paypal_email TEXT DEFAULT NULL;
