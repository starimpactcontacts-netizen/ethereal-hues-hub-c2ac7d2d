
-- Add new fields to crew_editor_applications for richer application data
ALTER TABLE public.crew_editor_applications 
  ADD COLUMN IF NOT EXISTS proof_url TEXT,
  ADD COLUMN IF NOT EXISTS software_used TEXT,
  ADD COLUMN IF NOT EXISTS wants_feedback BOOLEAN DEFAULT true;
