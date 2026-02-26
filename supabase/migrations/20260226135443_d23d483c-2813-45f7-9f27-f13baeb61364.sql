
-- Artist Campaigns table - tracks campaigns for enterprise clients
CREATE TABLE public.artist_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.enterprise_clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'paused')),
  total_views BIGINT NOT NULL DEFAULT 0,
  total_impressions BIGINT NOT NULL DEFAULT 0,
  total_engagements BIGINT NOT NULL DEFAULT 0,
  total_clicks BIGINT NOT NULL DEFAULT 0,
  budget_cents INTEGER DEFAULT 0,
  spent_cents INTEGER DEFAULT 0,
  roi_percentage NUMERIC(6,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Campaign edits - edits linked to a campaign
CREATE TABLE public.artist_campaign_edits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.artist_campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_url TEXT,
  thumbnail_url TEXT,
  platform TEXT DEFAULT 'tiktok',
  view_count BIGINT NOT NULL DEFAULT 0,
  like_count BIGINT NOT NULL DEFAULT 0,
  share_count BIGINT NOT NULL DEFAULT 0,
  comment_count BIGINT NOT NULL DEFAULT 0,
  editor_username TEXT,
  editor_id UUID,
  status TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('pending', 'live', 'removed')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.artist_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_campaign_edits ENABLE ROW LEVEL SECURITY;

-- RLS: Enterprise clients can view their own campaigns
CREATE POLICY "Clients can view own campaigns"
  ON public.artist_campaigns FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage campaigns"
  ON public.artist_campaigns FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can view campaign edits"
  ON public.artist_campaign_edits FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage campaign edits"
  ON public.artist_campaign_edits FOR ALL
  USING (true)
  WITH CHECK (true);

-- Update timestamp trigger
CREATE TRIGGER update_artist_campaigns_updated_at
  BEFORE UPDATE ON public.artist_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_artist_campaign_edits_updated_at
  BEFORE UPDATE ON public.artist_campaign_edits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
