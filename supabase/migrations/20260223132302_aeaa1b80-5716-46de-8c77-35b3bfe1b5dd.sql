-- Add category/type field for articles (daily_cover, press_release, feature, breaking, artist_spotlight, unit_showcase, review, opinion)
ALTER TABLE public.editorium_articles ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'feature';

-- Add priority for ordering within sections
ALTER TABLE public.editorium_articles ADD COLUMN IF NOT EXISTS priority integer NOT NULL DEFAULT 0;

-- Add is_breaking flag for the breaking news ticker
ALTER TABLE public.editorium_articles ADD COLUMN IF NOT EXISTS is_breaking boolean NOT NULL DEFAULT false;

-- Add is_daily_cover flag
ALTER TABLE public.editorium_articles ADD COLUMN IF NOT EXISTS is_daily_cover boolean NOT NULL DEFAULT false;