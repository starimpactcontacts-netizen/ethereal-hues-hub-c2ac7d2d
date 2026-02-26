import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RecentSolo {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  song_name: string;
  artist_name: string | null;
  theme: string;
  submission_url: string | null;
  submission_platform: string | null;
  thumbnail_url: string | null;
  video_title: string | null;
  qoi_score: number | null;
  status: string;
  created_at: string;
  submitted_at: string | null;
  judged_at: string | null;
  index_awarded: number;
}

export function useRecentSoloSubmissions(limit = 20) {
  const [submissions, setSubmissions] = useState<RecentSolo[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, editing: 0, submitted: 0, scored: 0 });

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('solo_submissions')
        .select('*')
        .in('status', ['editing', 'submitted', 'judging', 'scored'])
        .order('created_at', { ascending: false })
        .limit(limit);

      const items = (data || []) as RecentSolo[];
      setSubmissions(items);

      // Get aggregate stats
      const { count: totalCount } = await supabase
        .from('solo_submissions')
        .select('id', { count: 'exact', head: true });

      setStats({
        total: totalCount || 0,
        editing: items.filter(s => s.status === 'editing').length,
        submitted: items.filter(s => s.status === 'submitted' || s.status === 'judging').length,
        scored: items.filter(s => s.status === 'scored').length,
      });

      setLoading(false);
    };
    fetch();

    // Realtime
    const channel = supabase
      .channel('solo-feed')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'solo_submissions',
      }, () => { fetch(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [limit]);

  return { submissions, loading, stats };
}
