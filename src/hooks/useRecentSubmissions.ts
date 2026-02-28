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
  type: 'round' | 'standard' | 'sanctioned' | 'battle';
  // Battle-specific fields
  opponent_username?: string | null;
  opponent_avatar_url?: string | null;
  battle_status?: string | null;
  winner_id?: string | null;
  challenger_score?: number | null;
  opponent_score?: number | null;
  battle_id?: string | null;
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

      // Fetch sanctioned tournament participations
      const { data: sanctionedData, error: sanctionedError } = await supabase
        .from('sanctioned_tournament_participants')
        .select('id, user_id, tournament_id, submission_url, submission_platform, qoi_score, submitted_at, final_rank')
        .not('submission_url', 'is', null)
        .order('submitted_at', { ascending: false, nullsFirst: false })
        .limit(limit);

      // Fetch recent 1v1 battles (with submissions)
      const { data: battleData, error: battleError } = await supabase
        .from('battles')
        .select('id, challenger_id, opponent_id, challenger_username, opponent_username, challenger_avatar_url, opponent_avatar_url, challenger_submission_url, opponent_submission_url, challenger_submission_platform, opponent_submission_platform, challenger_score, opponent_score, status, winner_id, created_at, challenge_type')
        .not('challenger_submission_url', 'is', null)
        .in('status', ['completed', 'judging', 'submitted', 'active'])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (roundError) console.error('Round fetch error:', roundError);
      if (eventError) console.error('Event fetch error:', eventError);
      if (sanctionedError) console.error('Sanctioned fetch error:', sanctionedError);
      if (battleError) console.error('Battle fetch error:', battleError);

      // Convert battles into submission items (one per participant who submitted)
      const battleItems: Array<any> = [];
      for (const b of (battleData || [])) {
        if (b.challenger_submission_url) {
          battleItems.push({
            id: `battle-c-${b.id}`,
            user_id: b.challenger_id,
            event_id: b.id,
            submission_url: b.challenger_submission_url,
            platform: b.challenger_submission_platform || 'tiktok',
            qoi_score: b.challenger_score,
            status: b.status,
            submitted_at: b.created_at,
            type: 'battle' as const,
            round_number: null,
            opponent_username: b.opponent_username,
            opponent_avatar_url: b.opponent_avatar_url,
            battle_status: b.status,
            winner_id: b.winner_id,
            challenger_score: b.challenger_score,
            opponent_score: b.opponent_score,
            battle_id: b.id,
          });
        }
        if (b.opponent_submission_url && b.opponent_id) {
          battleItems.push({
            id: `battle-o-${b.id}`,
            user_id: b.opponent_id,
            event_id: b.id,
            submission_url: b.opponent_submission_url,
            platform: b.opponent_submission_platform || 'tiktok',
            qoi_score: b.opponent_score,
            status: b.status,
            submitted_at: b.created_at,
            type: 'battle' as const,
            round_number: null,
            opponent_username: b.challenger_username,
            opponent_avatar_url: b.challenger_avatar_url,
            battle_status: b.status,
            winner_id: b.winner_id,
            challenger_score: b.opponent_score,
            opponent_score: b.challenger_score,
            battle_id: b.id,
          });
        }
      }

      const allData = [
        ...(roundData || []).map(d => ({ ...d, type: 'round' as const, round_number: d.round_number })),
        ...(eventData || []).map(d => ({ ...d, type: 'standard' as const, round_number: null })),
        ...(sanctionedData || []).map(d => ({ 
          id: d.id,
          user_id: d.user_id,
          event_id: d.tournament_id,
          submission_url: d.submission_url,
          platform: d.submission_platform || 'tiktok',
          qoi_score: d.qoi_score,
          status: d.qoi_score ? 'scored' : 'pending',
          submitted_at: d.submitted_at,
          type: 'sanctioned' as const, 
          round_number: null 
        })),
        ...battleItems,
      ];

      if (allData.length === 0) {
        setSubmissions([]);
        setLoading(false);
        return;
      }

      // Get unique user and event IDs
      const userIds = [...new Set(allData.map(s => s.user_id))];
      const eventIds = [...new Set(allData.filter(s => s.type !== 'sanctioned' && s.type !== 'battle').map(s => s.event_id))];
      const tournamentIds = [...new Set(allData.filter(s => s.type === 'sanctioned').map(s => s.event_id))];

      // Fetch profiles, events, and tournaments in parallel
      const [profilesRes, eventsRes, tournamentsRes] = await Promise.all([
        supabase.from('profiles').select('id, username, display_name, avatar_url, global_index_score').in('id', userIds),
        eventIds.length > 0 ? supabase.from('events').select('id, title').in('id', eventIds) : { data: [] },
        tournamentIds.length > 0 ? supabase.from('sanctioned_tournaments').select('id, name').in('id', tournamentIds) : { data: [] }
      ]);

      const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
      const eventMap = new Map((eventsRes.data || []).map(e => [e.id, e]));
      const tournamentMap = new Map((tournamentsRes.data || []).map(t => [t.id, { id: t.id, title: t.name }]));

      const enriched: RecentSubmission[] = allData.map(s => ({
        id: s.id,
        user_id: s.user_id,
        username: profileMap.get(s.user_id)?.username || 'editor',
        display_name: profileMap.get(s.user_id)?.display_name || null,
        avatar_url: profileMap.get(s.user_id)?.avatar_url || null,
        global_index_score: profileMap.get(s.user_id)?.global_index_score || 0,
        event_id: s.event_id,
        event_title: s.type === 'battle'
          ? '1v1 Battle'
          : s.type === 'sanctioned' 
            ? tournamentMap.get(s.event_id)?.title || 'Sanctioned Tournament'
            : eventMap.get(s.event_id)?.title || 'Event',
        submission_url: s.submission_url!,
        platform: s.platform || 'tiktok',
        qoi_score: s.qoi_score,
        status: s.status || 'pending',
        submitted_at: s.submitted_at || new Date().toISOString(),
        round_number: s.round_number,
        type: s.type,
        // Battle-specific
        opponent_username: (s as any).opponent_username || null,
        opponent_avatar_url: (s as any).opponent_avatar_url || null,
        battle_status: (s as any).battle_status || null,
        winner_id: (s as any).winner_id || null,
        challenger_score: (s as any).challenger_score || null,
        opponent_score: (s as any).opponent_score || null,
        battle_id: (s as any).battle_id || null,
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
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'sanctioned_tournament_participants'
      }, () => fetchSubmissions())
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'battles'
      }, () => fetchSubmissions())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSubmissions]);

  return { submissions, loading, refetch: fetchSubmissions };
}
