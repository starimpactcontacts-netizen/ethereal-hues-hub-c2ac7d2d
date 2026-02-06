-- Unit Editor Tiers (custom per crew)
CREATE TABLE public.crew_editor_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  tier_order INTEGER NOT NULL DEFAULT 1,
  color TEXT DEFAULT '#FFD700',
  icon TEXT DEFAULT '⭐',
  perks JSONB DEFAULT '[]'::jsonb,
  requirements TEXT,
  application_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unit Editor Applications
CREATE TABLE public.crew_editor_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES public.crew_editor_tiers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  submission_url TEXT NOT NULL,
  platform TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unit Editors (approved applicants)
CREATE TABLE public.crew_editors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  tier_id UUID NOT NULL REFERENCES public.crew_editor_tiers(id) ON DELETE CASCADE,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(crew_id, user_id)
);

-- Unit Channels (Discord-like)
CREATE TABLE public.crew_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  channel_type TEXT NOT NULL DEFAULT 'text',
  category TEXT,
  category_order INTEGER DEFAULT 0,
  channel_order INTEGER DEFAULT 0,
  is_editor_only BOOLEAN DEFAULT false,
  min_tier_order INTEGER DEFAULT 0,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unit Channel Messages
CREATE TABLE public.crew_channel_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.crew_channels(id) ON DELETE CASCADE,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  message_text TEXT NOT NULL,
  is_bot BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unit Assets (logos, PFPs, overlays for editors)
CREATE TABLE public.crew_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL DEFAULT 'logo',
  asset_url TEXT NOT NULL,
  min_tier_order INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crew_editor_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_editor_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_editors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_channel_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crew_editor_tiers (public read, owner/officer write)
CREATE POLICY "Anyone can view tiers" ON public.crew_editor_tiers FOR SELECT USING (true);
CREATE POLICY "Crew officers can manage tiers" ON public.crew_editor_tiers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.crew_members WHERE crew_id = crew_editor_tiers.crew_id AND user_id = auth.uid() AND role IN ('owner', 'officer'))
);

-- RLS Policies for applications
CREATE POLICY "Users can view their own applications" ON public.crew_editor_applications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Crew officers can view all applications" ON public.crew_editor_applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.crew_members WHERE crew_id = crew_editor_applications.crew_id AND user_id = auth.uid() AND role IN ('owner', 'officer'))
);
CREATE POLICY "Anyone can apply" ON public.crew_editor_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Crew officers can update applications" ON public.crew_editor_applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.crew_members WHERE crew_id = crew_editor_applications.crew_id AND user_id = auth.uid() AND role IN ('owner', 'officer'))
);

-- RLS Policies for editors
CREATE POLICY "Anyone can view editors" ON public.crew_editors FOR SELECT USING (true);
CREATE POLICY "Crew officers can manage editors" ON public.crew_editors FOR ALL USING (
  EXISTS (SELECT 1 FROM public.crew_members WHERE crew_id = crew_editors.crew_id AND user_id = auth.uid() AND role IN ('owner', 'officer'))
);

-- RLS Policies for channels
CREATE POLICY "Members can view channels" ON public.crew_channels FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.crew_members WHERE crew_id = crew_channels.crew_id AND user_id = auth.uid())
  OR NOT is_editor_only
);
CREATE POLICY "Crew officers can manage channels" ON public.crew_channels FOR ALL USING (
  EXISTS (SELECT 1 FROM public.crew_members WHERE crew_id = crew_channels.crew_id AND user_id = auth.uid() AND role IN ('owner', 'officer'))
);

-- RLS Policies for channel messages
CREATE POLICY "Members can view channel messages" ON public.crew_channel_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.crew_members WHERE crew_id = crew_channel_messages.crew_id AND user_id = auth.uid())
);
CREATE POLICY "Members can send messages" ON public.crew_channel_messages FOR INSERT WITH CHECK (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.crew_members WHERE crew_id = crew_channel_messages.crew_id AND user_id = auth.uid())
);

-- RLS Policies for assets
CREATE POLICY "Editors can view assets based on tier" ON public.crew_assets FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.crew_editors ce 
    JOIN public.crew_editor_tiers t ON ce.tier_id = t.id 
    WHERE ce.crew_id = crew_assets.crew_id AND ce.user_id = auth.uid() AND t.tier_order >= crew_assets.min_tier_order
  )
  OR EXISTS (SELECT 1 FROM public.crew_members WHERE crew_id = crew_assets.crew_id AND user_id = auth.uid() AND role IN ('owner', 'officer'))
);
CREATE POLICY "Crew officers can manage assets" ON public.crew_assets FOR ALL USING (
  EXISTS (SELECT 1 FROM public.crew_members WHERE crew_id = crew_assets.crew_id AND user_id = auth.uid() AND role IN ('owner', 'officer'))
);

-- Enable realtime for channels
ALTER PUBLICATION supabase_realtime ADD TABLE public.crew_channel_messages;

-- Indexes
CREATE INDEX idx_crew_editor_tiers_crew ON public.crew_editor_tiers(crew_id);
CREATE INDEX idx_crew_editor_applications_crew ON public.crew_editor_applications(crew_id);
CREATE INDEX idx_crew_editor_applications_user ON public.crew_editor_applications(user_id);
CREATE INDEX idx_crew_editors_crew ON public.crew_editors(crew_id);
CREATE INDEX idx_crew_editors_user ON public.crew_editors(user_id);
CREATE INDEX idx_crew_channels_crew ON public.crew_channels(crew_id);
CREATE INDEX idx_crew_channel_messages_channel ON public.crew_channel_messages(channel_id);
CREATE INDEX idx_crew_assets_crew ON public.crew_assets(crew_id);