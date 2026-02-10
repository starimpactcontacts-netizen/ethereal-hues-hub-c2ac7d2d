-- Fix: Allow all feed submission types for comments
ALTER TABLE public.feed_comments DROP CONSTRAINT feed_comments_submission_type_check;
ALTER TABLE public.feed_comments ADD CONSTRAINT feed_comments_submission_type_check 
  CHECK (submission_type = ANY (ARRAY['arena'::text, 'review'::text, 'battle'::text, 'judge_video'::text]));