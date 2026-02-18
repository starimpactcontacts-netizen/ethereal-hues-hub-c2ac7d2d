
-- Editorium articles table
CREATE TABLE public.editorium_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  subtitle text,
  excerpt text,
  body text NOT NULL,
  cover_image_url text,
  header_image_url text,
  unit_id uuid REFERENCES public.crews(id) ON DELETE SET NULL,
  author_name text NOT NULL DEFAULT 'LOOPGATE Editorial',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  tags text[] DEFAULT '{}',
  read_time_minutes integer DEFAULT 5,
  view_count integer DEFAULT 0,
  featured boolean DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  seo_title text,
  seo_description text,
  seo_keywords text[]
);

-- Enable RLS
ALTER TABLE public.editorium_articles ENABLE ROW LEVEL SECURITY;

-- Public can read published articles
CREATE POLICY "Anyone can read published articles"
ON public.editorium_articles FOR SELECT
USING (status = 'published');

-- Slug generation function
CREATE OR REPLACE FUNCTION public.generate_editorium_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  IF NEW.slug IS NOT NULL AND (TG_OP = 'UPDATE' AND OLD.title = NEW.title) THEN
    RETURN NEW;
  END IF;
  base_slug := lower(regexp_replace(regexp_replace(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  base_slug := substring(base_slug from 1 for 80);
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.editorium_articles WHERE slug = final_slug AND id != NEW.id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_editorium_slug
BEFORE INSERT OR UPDATE ON public.editorium_articles
FOR EACH ROW EXECUTE FUNCTION public.generate_editorium_slug();

-- Auto-set published_at
CREATE OR REPLACE FUNCTION public.set_editorium_published_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    NEW.published_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_editorium_published_at
BEFORE INSERT OR UPDATE ON public.editorium_articles
FOR EACH ROW EXECUTE FUNCTION public.set_editorium_published_at();

-- View count incrementer
CREATE OR REPLACE FUNCTION public.increment_editorium_views(article_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.editorium_articles SET view_count = COALESCE(view_count, 0) + 1 WHERE id = article_id;
END;
$$;
