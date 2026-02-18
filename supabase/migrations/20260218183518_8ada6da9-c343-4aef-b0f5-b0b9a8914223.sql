
-- Allow admins/devs to read all articles (including drafts)
CREATE POLICY "Admins can read all articles"
ON public.editorium_articles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

-- Allow admins/devs to insert articles
CREATE POLICY "Admins can insert articles"
ON public.editorium_articles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

-- Allow admins/devs to update articles
CREATE POLICY "Admins can update articles"
ON public.editorium_articles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

-- Allow admins/devs to delete articles
CREATE POLICY "Admins can delete articles"
ON public.editorium_articles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));
