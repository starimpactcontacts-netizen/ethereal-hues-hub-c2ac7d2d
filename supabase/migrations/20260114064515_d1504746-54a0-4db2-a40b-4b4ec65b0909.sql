-- Add archetype and software fields to profiles
ALTER TABLE public.profiles
ADD COLUMN archetype text DEFAULT NULL,
ADD COLUMN software text[] DEFAULT '{}'::text[];

-- Add category field to events for event archetype/category
ALTER TABLE public.events
ADD COLUMN editor_category text DEFAULT NULL;