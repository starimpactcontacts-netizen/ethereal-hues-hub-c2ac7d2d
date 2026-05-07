-- Campaign edit feedback (client thumbs up/down with optional reason)
CREATE TABLE public.campaign_edit_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  edit_id UUID NOT NULL,
  campaign_id UUID,
  reaction TEXT NOT NULL CHECK (reaction IN ('up','down')),
  note TEXT,
  client_name TEXT,
  reviewed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaign_edit_feedback_edit ON public.campaign_edit_feedback(edit_id);
CREATE INDEX idx_campaign_edit_feedback_campaign ON public.campaign_edit_feedback(campaign_id);

ALTER TABLE public.campaign_edit_feedback ENABLE ROW LEVEL SECURITY;

-- Anyone with portal link can submit feedback
CREATE POLICY "Anyone can submit campaign edit feedback"
ON public.campaign_edit_feedback
FOR INSERT
WITH CHECK (true);

-- Only admins can read feedback
CREATE POLICY "Admins can view all feedback"
ON public.campaign_edit_feedback
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update (mark reviewed)
CREATE POLICY "Admins can update feedback"
ON public.campaign_edit_feedback
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));