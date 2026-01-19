-- Drop the unique constraint on user_id in crew_members to allow admins to be in multiple crews
ALTER TABLE public.crew_members DROP CONSTRAINT IF EXISTS crew_members_user_id_key;