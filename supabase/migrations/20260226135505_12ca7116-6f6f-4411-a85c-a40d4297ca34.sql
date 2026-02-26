
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Admins can manage campaigns" ON public.artist_campaigns;
DROP POLICY IF EXISTS "Admins can manage campaign edits" ON public.artist_campaign_edits;

-- Only allow mutations from service_role (edge functions) or authenticated admins/devs
CREATE POLICY "Service role manages campaigns"
  ON public.artist_campaigns FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role updates campaigns"
  ON public.artist_campaigns FOR UPDATE
  TO service_role
  USING (true);

CREATE POLICY "Service role deletes campaigns"
  ON public.artist_campaigns FOR DELETE
  TO service_role
  USING (true);

CREATE POLICY "Service role manages campaign edits"
  ON public.artist_campaign_edits FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role updates campaign edits"
  ON public.artist_campaign_edits FOR UPDATE
  TO service_role
  USING (true);

CREATE POLICY "Service role deletes campaign edits"
  ON public.artist_campaign_edits FOR DELETE
  TO service_role
  USING (true);

-- Authenticated admin/dev users can also manage via has_role
CREATE POLICY "Admins can insert campaigns"
  ON public.artist_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

CREATE POLICY "Admins can update campaigns"
  ON public.artist_campaigns FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

CREATE POLICY "Admins can delete campaigns"
  ON public.artist_campaigns FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

CREATE POLICY "Admins can insert campaign edits"
  ON public.artist_campaign_edits FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

CREATE POLICY "Admins can update campaign edits"
  ON public.artist_campaign_edits FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

CREATE POLICY "Admins can delete campaign edits"
  ON public.artist_campaign_edits FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));
