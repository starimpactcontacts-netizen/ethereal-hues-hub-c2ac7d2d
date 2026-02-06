-- Create function to get unread count per channel for a user (if not exists)
CREATE OR REPLACE FUNCTION public.get_channel_unread_counts(p_user_id UUID, p_crew_id UUID)
RETURNS TABLE(channel_id UUID, unread_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ch.id as channel_id,
    COUNT(m.id)::BIGINT as unread_count
  FROM public.crew_channels ch
  LEFT JOIN public.crew_channel_reads r ON r.channel_id = ch.id AND r.user_id = p_user_id
  LEFT JOIN public.crew_channel_messages m ON m.channel_id = ch.id 
    AND m.created_at > COALESCE(r.last_read_at, '1970-01-01'::timestamptz)
    AND m.user_id != p_user_id
  WHERE ch.crew_id = p_crew_id
  GROUP BY ch.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;