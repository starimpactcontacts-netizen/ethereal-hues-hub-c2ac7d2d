import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RecentSubmission {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  global_index_score: number;
  event_id: string;
  event_title: string;
  submission_url: string;
  platform: string;
  qoi_score: number | null;
  status: string;
  submitted_at: string;
  round_number: number | null;
  type: 'round' | 'standard';
}

// Extract video thumbnail from URL
export function getVideoThumbnail(url: string, platform: string): string | null {
  try {
    if (platform === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
      // Extract YouTube video ID
      const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      if (match) {
        return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
      }
    }
    // TikTok and Instagram don't have easy thumbnail APIs
    return null;
  } catch {
    return null;
  }
}

export function useRecentSubmissions(limit: number = 10) {
  const [submissions, setSubmissions] = useState<RecentSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubmissions = useCallback(async () => {
    try {
      // Fetch round participations with submissions
      const { data: roundData, error: roundError } = await supabase
        .from('round_participations')
        .select('id, user_id, event_id, submission_url, platform, qoi_score, status, submitted_at, round_number')
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
        ...(roundData || []).map(d => ({ ...d, type: 'round' as const, round_number: d.round_number })),
        ...(eventData || []).map(d => ({ ...d, type: 'standard' as const, round_number: null })),
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
        supabase.from('profiles').select('id, username, display_name, avatar_url, global_index_score').in('id', userIds),
        supabase.from('events').select('id, title').in('id', eventIds)
      ]);

      const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
      const eventMap = new Map((eventsRes.data || []).map(e => [e.id, e]));

      const enriched: RecentSubmission[] = allData.map(s => ({
        id: s.id,
        user_id: s.user_id,
        username: profileMap.get(s.user_id)?.username || 'editor',
        display_name: profileMap.get(s.user_id)?.display_name || null,
        avatar_url: profileMap.get(s.user_id)?.avatar_url || null,
        global_index_score: profileMap.get(s.user_id)?.global_index_score || 0,
        event_id: s.event_id,
        event_title: eventMap.get(s.event_id)?.title || 'Event',
        submission_url: s.submission_url!,
        platform: s.platform || 'tiktok',
        qoi_score: s.qoi_score,
        status: s.status || 'pending',
        submitted_at: s.submitted_at || new Date().toISOString(),
        round_number: s.round_number,
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
