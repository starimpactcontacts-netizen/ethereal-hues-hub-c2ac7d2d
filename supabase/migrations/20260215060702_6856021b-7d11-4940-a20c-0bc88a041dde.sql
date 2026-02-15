
-- Enterprise clients table - completely separate from auth.users
CREATE TABLE public.enterprise_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT, -- NULL if using OTP-only
  display_name TEXT,
  session_token TEXT UNIQUE,
  session_expires_at TIMESTAMPTZ,
  otp_code TEXT,
  otp_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: only edge functions (service role) access this table
ALTER TABLE public.enterprise_clients ENABLE ROW LEVEL SECURITY;

-- No public RLS policies — only service_role can read/write
-- This ensures clients can't directly query the table
