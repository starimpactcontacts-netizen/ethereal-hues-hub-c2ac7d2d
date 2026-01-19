-- Create crew announcements table
CREATE TABLE public.crew_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crew_announcements ENABLE ROW LEVEL SECURITY;

-- Anyone can read announcements for crews they're in
CREATE POLICY "Crew members can view announcements" 
ON public.crew_announcements 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM crew_members 
    WHERE crew_members.crew_id = crew_announcements.crew_id 
    AND crew_members.user_id = auth.uid()
  )
);

-- Only owner/officers can create announcements
CREATE POLICY "Staff can create announcements" 
ON public.crew_announcements 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM crew_members 
    WHERE crew_members.crew_id = crew_announcements.crew_id 
    AND crew_members.user_id = auth.uid()
    AND crew_members.role IN ('owner', 'officer')
  )
);

-- Staff can delete their own announcements
CREATE POLICY "Staff can delete announcements" 
ON public.crew_announcements 
FOR DELETE 
USING (
  author_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM crew_members 
    WHERE crew_members.crew_id = crew_announcements.crew_id 
    AND crew_members.user_id = auth.uid()
    AND crew_members.role = 'owner'
  )
);

-- Create table to track which announcements user has seen
CREATE TABLE public.crew_announcement_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, crew_id)
);

-- Enable RLS
ALTER TABLE public.crew_announcement_reads ENABLE ROW LEVEL SECURITY;

-- Users can manage their own read status
CREATE POLICY "Users can manage their own read status" 
ON public.crew_announcement_reads 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Enable realtime for announcements
ALTER PUBLICATION supabase_realtime ADD TABLE public.crew_announcements;