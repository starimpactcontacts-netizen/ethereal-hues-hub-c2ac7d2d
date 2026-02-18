-- Allow multiple submissions per user per drop
ALTER TABLE public.featured_submissions DROP CONSTRAINT featured_submissions_drop_id_user_id_key;