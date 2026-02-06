
-- Add Unit Identity fields to crews table
ALTER TABLE public.crews 
  ADD COLUMN IF NOT EXISTS unit_standards TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS content_style TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS requirements_text TEXT DEFAULT NULL;

-- Create logo previews table
CREATE TABLE public.unit_logo_previews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL,
  image_url TEXT NOT NULL,
  title TEXT DEFAULT 'Logo Preview',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'approved', 'discarded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create logo votes table
CREATE TABLE public.unit_logo_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  preview_id UUID NOT NULL REFERENCES public.unit_logo_previews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🔥',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(preview_id, user_id)
);

-- Enable RLS
ALTER TABLE public.unit_logo_previews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_logo_votes ENABLE ROW LEVEL SECURITY;

-- Logo previews policies
CREATE POLICY "Members can view logo previews" ON public.unit_logo_previews
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.crew_members WHERE crew_id = unit_logo_previews.crew_id AND user_id = auth.uid())
  );

CREATE POLICY "Staff can insert logo previews" ON public.unit_logo_previews
  FOR INSERT WITH CHECK (
    public.is_crew_staff(crew_id, auth.uid())
  );

CREATE POLICY "Staff can update logo previews" ON public.unit_logo_previews
  FOR UPDATE USING (
    public.is_crew_staff(crew_id, auth.uid())
  );

CREATE POLICY "Staff can delete logo previews" ON public.unit_logo_previews
  FOR DELETE USING (
    public.is_crew_staff(crew_id, auth.uid())
  );

-- Logo votes policies
CREATE POLICY "Members can view votes" ON public.unit_logo_votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.unit_logo_previews p 
      JOIN public.crew_members cm ON cm.crew_id = p.crew_id 
      WHERE p.id = unit_logo_votes.preview_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can vote" ON public.unit_logo_votes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.unit_logo_previews p 
      JOIN public.crew_members cm ON cm.crew_id = p.crew_id 
      WHERE p.id = unit_logo_votes.preview_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove own vote" ON public.unit_logo_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.unit_logo_previews;
ALTER PUBLICATION supabase_realtime ADD TABLE public.unit_logo_votes;
