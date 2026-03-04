
ALTER TABLE public.featured_drops ADD COLUMN arena_eligible boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.featured_drops.arena_eligible IS 'Whether this drop appears in Solo Arena for paid submissions';
