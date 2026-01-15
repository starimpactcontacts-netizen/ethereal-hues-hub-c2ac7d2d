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

    if (standardError) {
      console.error('Error fetching standard submissions:', standardError);
    }
    if (roundError) {
      console.error('Error fetching round submissions:', roundError);
    }

    // Merge both submission types
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

    // Fetch event details for each submission
    const eventIds = [...new Set(allSubmissions.map(s => s.event_id))];
    const { data: eventsData } = await supabase
      .from('events')
      .select('id, title, status, poster_url')
      .in('id', eventIds);

    const eventsMap = new Map((eventsData || []).map(e => [e.id, e]));

    const submissionsWithEvents = allSubmissions.map(s => ({
      ...s,
      event: eventsMap.get(s.event_id) || undefined
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
