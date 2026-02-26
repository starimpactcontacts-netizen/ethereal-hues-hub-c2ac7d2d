
-- Add campaign goal tracking
ALTER TABLE public.artist_campaigns ADD COLUMN IF NOT EXISTS goal_views integer NOT NULL DEFAULT 0;
ALTER TABLE public.artist_campaigns ADD COLUMN IF NOT EXISTS goal_label text DEFAULT NULL;

-- Dashboard update requests from clients to admin
CREATE TABLE public.dashboard_update_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.enterprise_clients(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.artist_campaigns(id) ON DELETE SET NULL,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid
);

ALTER TABLE public.dashboard_update_requests ENABLE ROW LEVEL SECURITY;

-- Public read for service role only (edge functions access via service role)
CREATE POLICY "Service role full access" ON public.dashboard_update_requests FOR ALL USING (true) WITH CHECK (true);
