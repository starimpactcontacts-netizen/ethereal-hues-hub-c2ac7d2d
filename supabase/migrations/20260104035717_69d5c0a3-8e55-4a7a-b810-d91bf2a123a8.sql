-- Create a table for enterprise campaigns/billing
CREATE TABLE public.enterprise_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  enterprise_user_id uuid NOT NULL,
  budget numeric DEFAULT 0,
  billing_status text DEFAULT 'pending' CHECK (billing_status IN ('pending', 'paid', 'outstanding', 'processing')),
  invoice_url text,
  asset_urls text[] DEFAULT '{}',
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.enterprise_campaigns ENABLE ROW LEVEL SECURITY;

-- Enterprise users can only see their own campaigns
CREATE POLICY "Enterprise users can view their own campaigns"
ON public.enterprise_campaigns
FOR SELECT
USING (auth.uid() = enterprise_user_id);

-- Enterprise users can create their own campaigns
CREATE POLICY "Enterprise users can create campaigns"
ON public.enterprise_campaigns
FOR INSERT
WITH CHECK (auth.uid() = enterprise_user_id AND has_role(auth.uid(), 'enterprise'::app_role));

-- Enterprise users can update their own campaigns
CREATE POLICY "Enterprise users can update their own campaigns"
ON public.enterprise_campaigns
FOR UPDATE
USING (auth.uid() = enterprise_user_id);

-- Admins can manage all campaigns
CREATE POLICY "Admins can manage all enterprise campaigns"
ON public.enterprise_campaigns
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_enterprise_campaigns_updated_at
BEFORE UPDATE ON public.enterprise_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();