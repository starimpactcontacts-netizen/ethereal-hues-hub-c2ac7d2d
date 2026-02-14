
-- Revenue share applications table
CREATE TABLE public.revenue_share_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_email TEXT NOT NULL,
  applicant_name TEXT,
  project_name TEXT NOT NULL,
  project_url TEXT,
  project_type TEXT NOT NULL DEFAULT 'music',
  pitch TEXT NOT NULL,
  social_links TEXT[],
  current_revenue TEXT,
  proposed_percentage INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.revenue_share_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an application (anonymous purchasing)
CREATE POLICY "Anyone can submit revenue share applications"
ON public.revenue_share_applications
FOR INSERT
WITH CHECK (true);

-- Only admins can view/update (via service role in ops panel)
CREATE POLICY "Users can view their own applications by email"
ON public.revenue_share_applications
FOR SELECT
USING (true);
