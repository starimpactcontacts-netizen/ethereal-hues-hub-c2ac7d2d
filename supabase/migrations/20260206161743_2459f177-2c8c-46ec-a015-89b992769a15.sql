
-- Tighten insert policies to require auth.uid() IS NOT NULL
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.unit_feed_posts;
CREATE POLICY "Authenticated users can create posts" ON public.unit_feed_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can react" ON public.unit_feed_reactions;
CREATE POLICY "Authenticated users can react" ON public.unit_feed_reactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can comment" ON public.unit_feed_comments;
CREATE POLICY "Authenticated users can comment" ON public.unit_feed_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
