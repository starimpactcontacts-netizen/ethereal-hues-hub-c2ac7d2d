-- Fix: Allow rapid mode durations (1, 2, 3 hours) alongside standard ones
ALTER TABLE public.battles DROP CONSTRAINT battles_duration_hours_check;
ALTER TABLE public.battles ADD CONSTRAINT battles_duration_hours_check CHECK (duration_hours = ANY (ARRAY[1, 2, 3, 24, 48, 72]));
