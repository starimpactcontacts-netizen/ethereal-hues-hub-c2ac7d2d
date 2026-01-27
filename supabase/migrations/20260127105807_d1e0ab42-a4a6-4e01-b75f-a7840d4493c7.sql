-- Create table for custom 6-digit OTP codes
CREATE TABLE public.login_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_login_codes_email_code ON public.login_codes (email, code);
CREATE INDEX idx_login_codes_expires ON public.login_codes (expires_at);

-- RLS - only service role can access
ALTER TABLE public.login_codes ENABLE ROW LEVEL SECURITY;

-- Clean up expired codes automatically (optional function)
CREATE OR REPLACE FUNCTION public.cleanup_expired_login_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.login_codes WHERE expires_at < now() - INTERVAL '1 hour';
END;
$$;