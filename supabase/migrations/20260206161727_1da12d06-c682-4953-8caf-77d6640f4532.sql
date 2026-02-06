
-- Unit Feed Posts table
CREATE TABLE public.unit_feed_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  post_type TEXT NOT NULL DEFAULT 'edit' CHECK (post_type IN ('edit', 'announcement', 'win', 'logo_preview')),
  content TEXT,
  media_url TEXT,
  media_platform TEXT,
  thumbnail_url TEXT,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unit Feed Reactions table
CREATE TABLE public.unit_feed_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.unit_feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, emoji)
);

-- Unit Feed Comments table
CREATE TABLE public.unit_feed_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.unit_feed_posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.unit_feed_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_unit_feed_posts_crew ON public.unit_feed_posts(crew_id, created_at DESC);
CREATE INDEX idx_unit_feed_posts_pinned ON public.unit_feed_posts(crew_id, is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_unit_feed_reactions_post ON public.unit_feed_reactions(post_id);
CREATE INDEX idx_unit_feed_comments_post ON public.unit_feed_comments(post_id, created_at);
CREATE INDEX idx_unit_feed_comments_parent ON public.unit_feed_comments(parent_id);

-- Enable RLS
ALTER TABLE public.unit_feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_feed_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_feed_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Posts
CREATE POLICY "Anyone can view unit feed posts" ON public.unit_feed_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON public.unit_feed_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.unit_feed_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.unit_feed_posts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: Reactions
CREATE POLICY "Anyone can view reactions" ON public.unit_feed_reactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can react" ON public.unit_feed_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own reactions" ON public.unit_feed_reactions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: Comments
CREATE POLICY "Anyone can view comments" ON public.unit_feed_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment" ON public.unit_feed_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.unit_feed_comments FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.unit_feed_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.unit_feed_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.unit_feed_comments;
