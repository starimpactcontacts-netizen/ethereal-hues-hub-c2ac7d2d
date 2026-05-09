-- Community moderation: user reports for battles & competitions
CREATE TYPE public.report_reason AS ENUM ('cheating','toxicity','harassment','spam','impersonation','inappropriate_content','other');
CREATE TYPE public.report_context AS ENUM ('battle','competition','submission','profile','chat','other');
CREATE TYPE public.report_status AS ENUM ('pending','reviewing','resolved','dismissed');

CREATE TABLE public.user_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  reported_user_id UUID NOT NULL,
  reason public.report_reason NOT NULL,
  context public.report_context NOT NULL DEFAULT 'other',
  context_id TEXT,
  details TEXT,
  status public.report_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_reports_no_self_report CHECK (reporter_id <> reported_user_id),
  CONSTRAINT user_reports_details_length CHECK (details IS NULL OR char_length(details) <= 2000)
);

CREATE INDEX idx_user_reports_reported ON public.user_reports(reported_user_id);
CREATE INDEX idx_user_reports_status ON public.user_reports(status);
CREATE INDEX idx_user_reports_context ON public.user_reports(context, context_id);
-- Rate limit: 1 active pending report per reporter per target per context
CREATE UNIQUE INDEX idx_user_reports_unique_pending
  ON public.user_reports(reporter_id, reported_user_id, context, COALESCE(context_id,''))
  WHERE status = 'pending';

ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- Reporters can create reports as themselves
CREATE POLICY "Users can file their own reports"
ON public.user_reports FOR INSERT TO authenticated
WITH CHECK (auth.uid() = reporter_id);

-- Reporters can view their own reports
CREATE POLICY "Users can view their own reports"
ON public.user_reports FOR SELECT TO authenticated
USING (auth.uid() = reporter_id);

-- Admins can view & manage all reports (relies on existing has_role + app_role 'admin')
CREATE POLICY "Admins can view all reports"
ON public.user_reports FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reports"
ON public.user_reports FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete reports"
ON public.user_reports FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE TRIGGER trg_user_reports_updated_at
BEFORE UPDATE ON public.user_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();