-- Connections table (handles both requests and established connections)
CREATE TABLE public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  UNIQUE(sender_id, receiver_id)
);

-- Index for fast lookups
CREATE INDEX idx_connections_sender ON public.connections(sender_id);
CREATE INDEX idx_connections_receiver ON public.connections(receiver_id);
CREATE INDEX idx_connections_status ON public.connections(status);

-- Weekly request limit tracking
CREATE TABLE public.connection_request_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  requests_sent INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Add connection_count to profiles for fast display
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS connection_count INTEGER NOT NULL DEFAULT 0;

-- Enable RLS
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_request_limits ENABLE ROW LEVEL SECURITY;

-- RLS: Users can see their own connections (sent or received)
CREATE POLICY "Users can view their own connections"
ON public.connections FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- RLS: Users can send connection requests
CREATE POLICY "Users can send connection requests"
ON public.connections FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- RLS: Users can update connections they received (accept/reject)
CREATE POLICY "Users can respond to connection requests"
ON public.connections FOR UPDATE
USING (auth.uid() = receiver_id AND status = 'pending');

-- RLS: Users can delete their sent pending requests
CREATE POLICY "Users can cancel their pending requests"
ON public.connections FOR DELETE
USING (auth.uid() = sender_id AND status = 'pending');

-- RLS for request limits - users can only see/update their own
CREATE POLICY "Users can view their own request limits"
ON public.connection_request_limits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own request limits"
ON public.connection_request_limits FOR ALL
USING (auth.uid() = user_id);

-- Function to increment connection count when accepted
CREATE OR REPLACE FUNCTION public.handle_connection_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
    -- Increment both users' connection counts
    UPDATE public.profiles SET connection_count = connection_count + 1 WHERE id = NEW.sender_id;
    UPDATE public.profiles SET connection_count = connection_count + 1 WHERE id = NEW.receiver_id;
    NEW.responded_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for connection acceptance
CREATE TRIGGER on_connection_accepted
BEFORE UPDATE ON public.connections
FOR EACH ROW
EXECUTE FUNCTION public.handle_connection_accepted();

-- Function to decrement connection count if connection is removed
CREATE OR REPLACE FUNCTION public.handle_connection_removed()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'accepted' THEN
    UPDATE public.profiles SET connection_count = GREATEST(0, connection_count - 1) WHERE id = OLD.sender_id;
    UPDATE public.profiles SET connection_count = GREATEST(0, connection_count - 1) WHERE id = OLD.receiver_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for connection removal
CREATE TRIGGER on_connection_removed
BEFORE DELETE ON public.connections
FOR EACH ROW
EXECUTE FUNCTION public.handle_connection_removed();

-- Enable realtime for connections (for live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;