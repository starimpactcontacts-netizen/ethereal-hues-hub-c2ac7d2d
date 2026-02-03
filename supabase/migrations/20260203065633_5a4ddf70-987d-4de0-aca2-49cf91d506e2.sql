-- Add max_members column to crews table (nullable = unlimited)
ALTER TABLE public.crews ADD COLUMN IF NOT EXISTS max_members integer DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.crews.max_members IS 'Maximum number of members allowed. NULL means unlimited.';