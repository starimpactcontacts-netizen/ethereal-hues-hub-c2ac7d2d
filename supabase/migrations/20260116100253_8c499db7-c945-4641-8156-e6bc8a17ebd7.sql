-- Create review_requests table for "Request Judge Review" feature
CREATE TABLE public.review_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  submission_url TEXT NOT NULL,
  platform TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, claimed, reviewed
  
  -- Request metadata
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Judge assignment (manual queue - judges claim from pool)
  judge_id UUID,
  claimed_at TIMESTAMP WITH TIME ZONE,
  
  -- Review scores (5-pillar system like GQT)
  emotion_score INTEGER,
  creativity_score INTEGER,
  sync_score INTEGER,
  identity_score INTEGER,
  execution_score INTEGER,
  total_score INTEGER,
  
  -- Judge commentary
  judge_comment TEXT,
  judge_username TEXT,
  judge_avatar_url TEXT,
  
  -- Review completion
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- User info (denormalized for feed display)
  username TEXT NOT NULL,
  avatar_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can view completed reviews (for feed)
CREATE POLICY "Anyone can view completed reviews"
ON public.review_requests
FOR SELECT
USING (status = 'reviewed' OR auth.uid() = user_id);

-- Users can create review requests
CREATE POLICY "Users can create review requests"
ON public.review_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Judges can update review requests (claim and review)
CREATE POLICY "Judges can update review requests"
ON public.review_requests
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'judge'::app_role) OR 
  has_role(auth.uid(), 'dev'::app_role)
);

-- Admins can delete review requests
CREATE POLICY "Admins can delete review requests"
ON public.review_requests
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.review_requests;

-- Create index for faster queries
CREATE INDEX idx_review_requests_status ON public.review_requests(status);
CREATE INDEX idx_review_requests_user_id ON public.review_requests(user_id);
CREATE INDEX idx_review_requests_requested_at ON public.review_requests(requested_at DESC);