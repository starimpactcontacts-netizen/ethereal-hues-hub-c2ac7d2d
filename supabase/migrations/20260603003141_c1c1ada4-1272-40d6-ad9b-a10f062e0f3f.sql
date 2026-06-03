ALTER TABLE public.feed_posts DROP CONSTRAINT IF EXISTS feed_posts_post_type_check;

ALTER TABLE public.feed_posts ADD CONSTRAINT feed_posts_post_type_check
  CHECK (post_type = ANY (ARRAY['text'::text, 'flex'::text, 'edit_share'::text, 'milestone'::text, 'profile_comment'::text]));