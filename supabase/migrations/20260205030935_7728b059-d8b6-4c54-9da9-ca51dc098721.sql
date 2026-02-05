-- Fix the overly permissive policy on connection_request_limits
DROP POLICY IF EXISTS "Users can manage their own request limits" ON public.connection_request_limits;

-- Create specific policies for INSERT and UPDATE
CREATE POLICY "Users can insert their own request limits"
ON public.connection_request_limits FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own request limits"
ON public.connection_request_limits FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own request limits"
ON public.connection_request_limits FOR DELETE
USING (auth.uid() = user_id);