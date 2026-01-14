-- Fix overly permissive INSERT policies by restricting to service role (triggers only)
-- Drop the existing overly permissive policies
DROP POLICY IF EXISTS "Service can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service can insert activity" ON public.activity_feed;

-- Notifications are inserted by triggers (SECURITY DEFINER functions), so no user INSERT policy needed
-- Activity feed is inserted by triggers (SECURITY DEFINER functions), so no user INSERT policy needed
-- The trigger functions run with SECURITY DEFINER which bypasses RLS