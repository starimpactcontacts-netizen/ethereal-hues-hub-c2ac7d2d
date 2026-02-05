-- Fix the UPDATE policy for connections to allow receivers to update pending requests to accepted/rejected
DROP POLICY IF EXISTS "Users can respond to connection requests" ON public.connections;

CREATE POLICY "Users can respond to connection requests"
ON public.connections
FOR UPDATE
USING (
  auth.uid() = receiver_id 
  AND status = 'pending'
)
WITH CHECK (
  auth.uid() = receiver_id
  AND status IN ('accepted', 'rejected')
);

-- Also add a policy for senders to delete their connections (for removing accepted connections)
DROP POLICY IF EXISTS "Users can remove accepted connections" ON public.connections;

CREATE POLICY "Users can remove accepted connections"
ON public.connections
FOR DELETE
USING (
  (auth.uid() = sender_id OR auth.uid() = receiver_id)
  AND status = 'accepted'
);