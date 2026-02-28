
-- Newsletter subscribers for Editorium
CREATE TABLE public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'editorium',
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT newsletter_subscribers_email_source_key UNIQUE (email, source)
);

-- Enable RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (insert)
CREATE POLICY "Anyone can subscribe to newsletter"
  ON public.newsletter_subscribers
  FOR INSERT
  WITH CHECK (true);

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
  ON public.newsletter_subscribers
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can unsubscribe (update their own)
CREATE POLICY "Users can update own subscription"
  ON public.newsletter_subscribers
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for lookups
CREATE INDEX idx_newsletter_subscribers_email ON public.newsletter_subscribers (email);
CREATE INDEX idx_newsletter_subscribers_source ON public.newsletter_subscribers (source);
