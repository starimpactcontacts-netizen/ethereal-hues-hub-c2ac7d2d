-- Add crew_extended_role enum for additional role badges
CREATE TYPE public.crew_extended_role AS ENUM ('ace_editor', 'veteran', 'challenger', 'recruiter', 'judge');

-- Add extended_role column to crew_members
ALTER TABLE public.crew_members ADD COLUMN extended_role public.crew_extended_role DEFAULT NULL;

-- Create table for crew rivalries
CREATE TABLE public.crew_rivalries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  rival_crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  UNIQUE(crew_id, rival_crew_id)
);

-- Enable RLS
ALTER TABLE public.crew_rivalries ENABLE ROW LEVEL SECURITY;

-- Anyone can view rivalries
CREATE POLICY "Anyone can view rivalries"
ON public.crew_rivalries
FOR SELECT
USING (true);

-- Only crew staff can create rivalries
CREATE POLICY "Staff can create rivalries"
ON public.crew_rivalries
FOR INSERT
WITH CHECK (
  is_crew_staff(crew_id, auth.uid())
);

-- Only crew staff can delete rivalries
CREATE POLICY "Staff can delete rivalries"
ON public.crew_rivalries
FOR DELETE
USING (
  is_crew_staff(crew_id, auth.uid())
);

-- Create table for crew activity feed
CREATE TABLE public.crew_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  user_id UUID,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crew_activity ENABLE ROW LEVEL SECURITY;

-- Crew members can view activity
CREATE POLICY "Crew members can view activity"
ON public.crew_activity
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM crew_members 
    WHERE crew_members.crew_id = crew_activity.crew_id 
    AND crew_members.user_id = auth.uid()
  )
);

-- Enable realtime for crew activity
ALTER PUBLICATION supabase_realtime ADD TABLE public.crew_activity;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crew_rivalries;