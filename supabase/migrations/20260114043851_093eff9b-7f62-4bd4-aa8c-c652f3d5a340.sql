-- Add policy for users to delete their own messages within 5 minutes
CREATE POLICY "Users can delete own messages within 5 minutes"
ON public.arena_messages
FOR DELETE
USING (
  auth.uid() = user_id 
  AND created_at > (now() - INTERVAL '5 minutes')
);

-- Same for crew messages
CREATE POLICY "Users can delete own crew messages within 5 minutes"
ON public.crew_messages
FOR DELETE
USING (
  auth.uid() = user_id 
  AND created_at > (now() - INTERVAL '5 minutes')
);