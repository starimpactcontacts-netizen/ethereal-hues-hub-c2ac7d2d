ALTER TABLE public.collab_messages ADD COLUMN IF NOT EXISTS gif_url TEXT;
ALTER TABLE public.collab_messages DROP CONSTRAINT IF EXISTS collab_messages_body_check;
ALTER TABLE public.collab_messages ALTER COLUMN body DROP NOT NULL;
ALTER TABLE public.collab_messages ADD CONSTRAINT collab_messages_content_check CHECK (
  (body IS NOT NULL AND length(body) > 0 AND length(body) <= 500) OR (gif_url IS NOT NULL AND length(gif_url) <= 500)
);