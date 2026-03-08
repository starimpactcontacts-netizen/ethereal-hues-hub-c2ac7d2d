
-- Link page settings (customization per user)
CREATE TABLE public.editor_link_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  page_title TEXT,
  bio TEXT,
  bg_type TEXT NOT NULL DEFAULT 'solid',
  bg_color TEXT DEFAULT '#0a0a0a',
  bg_gradient_from TEXT,
  bg_gradient_to TEXT,
  bg_image_url TEXT,
  accent_color TEXT DEFAULT '#d4af37',
  text_color TEXT DEFAULT '#ffffff',
  card_style TEXT DEFAULT 'default',
  show_avatar BOOLEAN DEFAULT true,
  show_stats BOOLEAN DEFAULT true,
  show_socials BOOLEAN DEFAULT true,
  custom_avatar_url TEXT,
  custom_css TEXT,
  is_published BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Individual links on the page
CREATE TABLE public.editor_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  thumbnail_url TEXT,
  link_type TEXT DEFAULT 'link',
  embed_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.editor_link_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editor_links ENABLE ROW LEVEL SECURITY;

-- Link pages: owner can CRUD, anyone can read published pages
CREATE POLICY "Users can manage own link page" ON public.editor_link_pages
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can view published link pages" ON public.editor_link_pages
  FOR SELECT TO anon, authenticated USING (is_published = true);

-- Links: owner can CRUD, anyone can read active links for published pages
CREATE POLICY "Users can manage own links" ON public.editor_links
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can view active links" ON public.editor_links
  FOR SELECT TO anon, authenticated USING (
    is_active = true AND EXISTS (
      SELECT 1 FROM public.editor_link_pages WHERE user_id = editor_links.user_id AND is_published = true
    )
  );

-- Index for fast lookups
CREATE INDEX idx_editor_links_user_order ON public.editor_links(user_id, sort_order);
CREATE INDEX idx_editor_link_pages_user ON public.editor_link_pages(user_id);
