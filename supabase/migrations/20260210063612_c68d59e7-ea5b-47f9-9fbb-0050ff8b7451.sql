
-- Judge inbox table: many-to-many between judges and review requests
CREATE TABLE public.judge_inbox (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  judge_id UUID NOT NULL,
  review_request_id UUID NOT NULL REFERENCES public.review_requests(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  dismissed BOOLEAN NOT NULL DEFAULT false,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(judge_id, review_request_id)
);

ALTER TABLE public.judge_inbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Judges can view their own inbox"
  ON public.judge_inbox FOR SELECT
  USING (auth.uid() = judge_id);

CREATE POLICY "Judges can update their own inbox"
  ON public.judge_inbox FOR UPDATE
  USING (auth.uid() = judge_id);

CREATE POLICY "System can insert inbox items"
  ON public.judge_inbox FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_judge_inbox_judge ON public.judge_inbox(judge_id, dismissed);
CREATE INDEX idx_judge_inbox_request ON public.judge_inbox(review_request_id);

-- Auto-assign new review requests to designated QOI judges (yugi & doris)
CREATE OR REPLACE FUNCTION public.auto_assign_qoi_judges()
RETURNS TRIGGER AS $$
DECLARE
  qoi_judge_ids UUID[] := ARRAY[
    '977f57dc-4d71-4b00-a7d7-e0e88d71e54c'::uuid,
    'fe01e056-1992-47cc-9000-2a2b46690fed'::uuid
  ];
  jid UUID;
BEGIN
  FOREACH jid IN ARRAY qoi_judge_ids LOOP
    INSERT INTO public.judge_inbox (judge_id, review_request_id)
    VALUES (jid, NEW.id)
    ON CONFLICT (judge_id, review_request_id) DO NOTHING;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_auto_assign_qoi_judges
  AFTER INSERT ON public.review_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_qoi_judges();

-- Backfill all existing review requests to yugi & doris
INSERT INTO public.judge_inbox (judge_id, review_request_id)
SELECT j.jid, rr.id
FROM public.review_requests rr
CROSS JOIN (
  VALUES 
    ('977f57dc-4d71-4b00-a7d7-e0e88d71e54c'::uuid),
    ('fe01e056-1992-47cc-9000-2a2b46690fed'::uuid)
) AS j(jid)
ON CONFLICT (judge_id, review_request_id) DO NOTHING;

ALTER PUBLICATION supabase_realtime ADD TABLE public.judge_inbox;
