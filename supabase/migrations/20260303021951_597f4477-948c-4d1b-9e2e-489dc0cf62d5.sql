
ALTER TABLE public.artist_campaigns
ADD COLUMN incoming_note text DEFAULT NULL;

COMMENT ON COLUMN public.artist_campaigns.incoming_note IS 'Admin-editable note shown on client dashboards, e.g. "3 edits incoming today"';
