
-- Marketplace fields for commissions
ALTER TABLE public.commissions
ADD COLUMN IF NOT EXISTS cover_url text,
ADD COLUMN IF NOT EXISTS poster_username text,
ADD COLUMN IF NOT EXISTS poster_avatar_url text,
ADD COLUMN IF NOT EXISTS platform_fee_cents integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS bounty_type text NOT NULL DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS requirements text,
ADD COLUMN IF NOT EXISTS reference_urls text[],
ADD COLUMN IF NOT EXISTS poster_rating_avg numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS poster_rating_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_marketplace boolean NOT NULL DEFAULT false;

-- Create bounty-covers storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('bounty-covers', 'bounty-covers', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Bounty covers are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'bounty-covers');

CREATE POLICY "Users can upload bounty covers"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'bounty-covers' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own bounty covers"
ON storage.objects FOR UPDATE
USING (bucket_id = 'bounty-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own bounty covers"
ON storage.objects FOR DELETE
USING (bucket_id = 'bounty-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Bounty poster ratings table
CREATE TABLE public.bounty_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id uuid NOT NULL REFERENCES public.commissions(id) ON DELETE CASCADE,
  rater_id uuid NOT NULL,
  poster_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(bounty_id, rater_id)
);

ALTER TABLE public.bounty_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view bounty ratings"
ON public.bounty_ratings FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create ratings"
ON public.bounty_ratings FOR INSERT
WITH CHECK (auth.uid() = rater_id);

-- Allow any authenticated user to create marketplace bounties
CREATE POLICY "Users can create marketplace bounties"
ON public.commissions FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND is_marketplace = true);

-- Users can update their own marketplace bounties
CREATE POLICY "Users can update own marketplace bounties"
ON public.commissions FOR UPDATE
USING (auth.uid() = created_by AND is_marketplace = true);

-- Sync poster ratings
CREATE OR REPLACE FUNCTION public.sync_bounty_poster_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avg_r NUMERIC;
  cnt INTEGER;
  p_id UUID;
BEGIN
  p_id := COALESCE(NEW.poster_id, OLD.poster_id);
  
  SELECT AVG(rating), COUNT(*) INTO avg_r, cnt
  FROM public.bounty_ratings
  WHERE poster_id = p_id;
  
  UPDATE public.commissions
  SET poster_rating_avg = COALESCE(avg_r, 0),
      poster_rating_count = COALESCE(cnt, 0)
  WHERE created_by = p_id AND is_marketplace = true;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER sync_bounty_rating
AFTER INSERT OR UPDATE OR DELETE ON public.bounty_ratings
FOR EACH ROW EXECUTE FUNCTION public.sync_bounty_poster_rating();
