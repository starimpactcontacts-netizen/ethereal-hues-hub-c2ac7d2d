import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserSubmission {
  id: string;
  event_id: string;
  submission_url: string;
  platform: string;
  status: string;
  quality_score: number | null;
  originality_score: number | null;
  impact_score: number | null;
  qoi_score: number | null;
  final_rank: number | null;
  submitted_at: string;
  thumbnail_url: string | null;
  source: 'standard' | 'round' | 'sanctioned';
  event?: {
    id: string;
    title: string;
    status: string;
    poster_url: string | null;
  };
}

export function useUserSubmissions(targetUserId?: string) {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<UserSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // Use targetUserId if provided, otherwise use current user
  const userId = targetUserId || user?.id;

  const fetchSubmissions = useCallback(async () => {
    if (!userId) {
      setSubmissions([]);
      setLoading(false);
      return;
    }

    // Fetch standard event submissions
    const { data: standardData, error: standardError } = await supabase
      .from('event_participations')
      .select('*')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false });

    // Fetch Open Arena round submissions
    const { data: roundData, error: roundError } = await supabase
      .from('round_participations')
      .select('*')
      .eq('user_id', userId)
      .not('submission_url', 'is', null)
      .order('submitted_at', { ascending: false });

    // Fetch Sanctioned Tournament submissions
    const { data: sanctionedData, error: sanctionedError } = await supabase
      .from('sanctioned_tournament_participants')
      .select('*, sanctioned_tournaments!inner(id, name, status)')
      .eq('user_id', userId)
      .not('submission_url', 'is', null)
      .order('submitted_at', { ascending: false });

    if (standardError) {
      console.error('Error fetching standard submissions:', standardError);
    }
    if (roundError) {
      console.error('Error fetching round submissions:', roundError);
    }
    if (sanctionedError) {
      console.error('Error fetching sanctioned submissions:', sanctionedError);
    }

    // Merge all submission types
    const allSubmissions = [
      ...(standardData || []).map(s => ({
        id: s.id,
        event_id: s.event_id,
        submission_url: s.submission_url,
        platform: s.platform,
        status: s.status || 'pending',
        quality_score: s.quality_score,
        originality_score: s.originality_score,
        impact_score: s.impact_score,
        qoi_score: s.qoi_score,
        final_rank: s.final_rank,
        submitted_at: s.submitted_at,
        thumbnail_url: s.thumbnail_url || null,
        source: 'standard' as const,
      })),
      ...(roundData || []).map(s => ({
        id: s.id,
        event_id: s.event_id,
        submission_url: s.submission_url!,
        platform: s.platform || 'tiktok',
        status: s.status || 'pending',
        quality_score: s.quality_score,
        originality_score: s.originality_score,
        impact_score: s.impact_score,
        qoi_score: s.qoi_score,
        final_rank: null,
        submitted_at: s.submitted_at || s.created_at,
        thumbnail_url: (s as any).thumbnail_url || null,
        source: 'round' as const,
      })),
      ...(sanctionedData || []).map(s => ({
        id: s.id,
        event_id: s.tournament_id,
        submission_url: s.submission_url!,
        platform: s.submission_platform || 'tiktok',
        status: s.qoi_score ? 'scored' : 'pending',
        quality_score: null,
        originality_score: null,
        impact_score: null,
        qoi_score: s.qoi_score,
        final_rank: s.final_rank,
        submitted_at: s.submitted_at || s.joined_at,
        thumbnail_url: (s as any).thumbnail_url || null,
        source: 'sanctioned' as const,
      })),
    ];

    // Sort by submitted_at descending
    allSubmissions.sort((a, b) => {
      const dateA = new Date(a.submitted_at || '').getTime();
      const dateB = new Date(b.submitted_at || '').getTime();
      return dateB - dateA;
    });

    if (allSubmissions.length === 0) {
      setSubmissions([]);
      setLoading(false);
      return;
    }

    // Fetch event details for non-sanctioned submissions
    const eventIds = [...new Set(allSubmissions.filter(s => s.source !== 'sanctioned').map(s => s.event_id))];
    const tournamentIds = [...new Set(allSubmissions.filter(s => s.source === 'sanctioned').map(s => s.event_id))];
    
    const [eventsRes, tournamentsRes] = await Promise.all([
      eventIds.length > 0 
        ? supabase.from('events').select('id, title, status, poster_url').in('id', eventIds)
        : { data: [] },
      tournamentIds.length > 0
        ? supabase.from('sanctioned_tournaments').select('id, name, status, poster_url').in('id', tournamentIds)
        : { data: [] }
    ]);

    const eventsMap = new Map((eventsRes.data || []).map(e => [e.id, e]));
    const tournamentsMap = new Map((tournamentsRes.data || []).map(t => [t.id, { id: t.id, title: t.name, status: t.status, poster_url: t.poster_url }]));

    const submissionsWithEvents = allSubmissions.map(s => ({
      ...s,
      event: s.source === 'sanctioned' 
        ? tournamentsMap.get(s.event_id) || undefined
        : eventsMap.get(s.event_id) || undefined
    })) as UserSubmission[];

    setSubmissions(submissionsWithEvents);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchSubmissions();

    if (!userId) return;

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`user-submissions-${userId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'event_participations',
        filter: `user_id=eq.${userId}`
      }, () => {
        fetchSubmissions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchSubmissions]);

  return { submissions, loading, refetch: fetchSubmissions };
}
