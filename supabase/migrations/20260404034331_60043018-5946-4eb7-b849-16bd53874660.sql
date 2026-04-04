
CREATE TABLE public.qoi_hidden_edits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source TEXT NOT NULL,
  source_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, source, source_id)
);

ALTER TABLE public.qoi_hidden_edits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read qoi hidden status"
  ON public.qoi_hidden_edits FOR SELECT USING (true);

CREATE POLICY "Users can manage their own qoi visibility"
  ON public.qoi_hidden_edits FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own qoi visibility"
  ON public.qoi_hidden_edits FOR DELETE USING (auth.uid() = user_id);
