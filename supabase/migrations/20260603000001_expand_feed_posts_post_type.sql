-- Expand the feed_posts.post_type CHECK constraint to include all post types
-- used in the application code (profile_comment, find_battle, rate_edit, etc.)
ALTER TABLE public.feed_posts
  DROP CONSTRAINT IF EXISTS feed_posts_post_type_check;

ALTER TABLE public.feed_posts
  ADD CONSTRAINT feed_posts_post_type_check
  CHECK (post_type IN (
    'text',
    'flex',
    'edit_share',
    'milestone',
    'find_battle',
    'rate_edit',
    'help',
    'competition',
    'news',
    'profile_comment'
  ));
