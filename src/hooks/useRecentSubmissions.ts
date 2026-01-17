import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RecentSubmission {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  event_id: string;
  event_title: string;
  submission_url: string;
  platform: string;
  qoi_score: number | null;
  status: string;
  submitted_at: string;
  type: 'round' | 'standard';
}

export function useRecentSubmissions(limit: number = 10) {
  const [submissions, setSubmissions] = useState<RecentSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubmissions = useCallback(async () => {
    try {
      // Fetch round participations with submissions
      const { data: roundData, error: roundError } = await supabase
        .from('round_participations')
        .select('id, user_id, event_id, submission_url, platform, qoi_score, status, submitted_at')
        .not('submission_url', 'is', null)
        .order('submitted_at', { ascending: false, nullsFirst: false })
        .limit(limit);

      // Fetch standard event participations
      const { data: eventData, error: eventError } = await supabase
        .from('event_participations')
        .select('id, user_id, event_id, submission_url, platform, qoi_score, status, submitted_at')
        .not('submission_url', 'is', null)
        .order('submitted_at', { ascending: false, nullsFirst: false })
        .limit(limit);

      if (roundError) console.error('Round fetch error:', roundError);
      if (eventError) console.error('Event fetch error:', eventError);

      const allData = [
        ...(roundData || []).map(d => ({ ...d, type: 'round' as const })),
        ...(eventData || []).map(d => ({ ...d, type: 'standard' as const })),
      ];

      if (allData.length === 0) {
        setSubmissions([]);
        setLoading(false);
        return;
      }

      // Get unique user and event IDs
      const userIds = [...new Set(allData.map(s => s.user_id))];
      const eventIds = [...new Set(allData.map(s => s.event_id))];

      // Fetch profiles and events in parallel
      const [profilesRes, eventsRes] = await Promise.all([
        supabase.from('profiles').select('id, username, avatar_url').in('id', userIds),
        supabase.from('events').select('id, title').in('id', eventIds)
      ]);

      const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
      const eventMap = new Map((eventsRes.data || []).map(e => [e.id, e]));

      const enriched: RecentSubmission[] = allData.map(s => ({
        id: s.id,
        user_id: s.user_id,
        username: profileMap.get(s.user_id)?.username || 'editor',
        avatar_url: profileMap.get(s.user_id)?.avatar_url || null,
        event_id: s.event_id,
        event_title: eventMap.get(s.event_id)?.title || 'Event',
        submission_url: s.submission_url!,
        platform: s.platform || 'tiktok',
        qoi_score: s.qoi_score,
        status: s.status || 'pending',
        submitted_at: s.submitted_at || new Date().toISOString(),
        type: s.type,
      }));

      // Sort by submitted_at and dedupe by submission_url
      const sorted = enriched.sort((a, b) => 
        new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
      );

      const seen = new Set<string>();
      const unique = sorted.filter(s => {
        if (seen.has(s.submission_url)) return false;
        seen.add(s.submission_url);
        return true;
      });

      setSubmissions(unique.slice(0, limit));
    } catch (error) {
      console.error('Error fetching recent submissions:', error);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchSubmissions();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('recent-submissions')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'round_participations'
      }, () => fetchSubmissions())
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'event_participations'
      }, () => fetchSubmissions())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSubmissions]);

  return { submissions, loading, refetch: fetchSubmissions };
}
