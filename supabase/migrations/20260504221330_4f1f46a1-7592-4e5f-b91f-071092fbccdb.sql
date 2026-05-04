ALTER TABLE public.battles DROP CONSTRAINT IF EXISTS battles_duration_hours_check;
ALTER TABLE public.battles ALTER COLUMN duration_hours TYPE numeric USING duration_hours::numeric;
ALTER TABLE public.battles ADD CONSTRAINT battles_duration_hours_check CHECK (duration_hours = ANY (ARRAY[0.25, 0.5, 1, 2, 3, 24, 48, 72]::numeric[]));