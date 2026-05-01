ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 30;

CREATE POLICY "Creators can delete their own competitions"
ON public.competitions
FOR DELETE
TO authenticated
USING (auth.uid() = creator_id);