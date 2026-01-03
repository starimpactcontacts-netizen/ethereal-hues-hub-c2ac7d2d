-- Create storage bucket for event posters
INSERT INTO storage.buckets (id, name, public) 
VALUES ('event-posters', 'event-posters', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to event posters
CREATE POLICY "Event posters are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-posters');

-- Allow admins to upload event posters
CREATE POLICY "Admins can upload event posters"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event-posters' AND public.has_role(auth.uid(), 'admin'));

-- Allow admins to update event posters
CREATE POLICY "Admins can update event posters"
ON storage.objects FOR UPDATE
USING (bucket_id = 'event-posters' AND public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete event posters
CREATE POLICY "Admins can delete event posters"
ON storage.objects FOR DELETE
USING (bucket_id = 'event-posters' AND public.has_role(auth.uid(), 'admin'));

-- Add category and region_tags columns to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS category text DEFAULT 'Film',
ADD COLUMN IF NOT EXISTS region_tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS description text;

-- Add judge_id to event_participations for tracking who scored
ALTER TABLE public.event_participations
ADD COLUMN IF NOT EXISTS judge_id uuid REFERENCES auth.users(id);