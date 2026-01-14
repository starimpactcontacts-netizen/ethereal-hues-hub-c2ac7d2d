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

export function useUserSubmissions() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<UserSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubmissions = useCallback(async () => {
    if (!user) {
      setSubmissions([]);
      setLoading(false);
      return;
    }

    // Fetch submissions
    const { data: submissionsData, error } = await supabase
      .from('event_participations')
      .select('*')
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching submissions:', error);
      setLoading(false);
      return;
    }

    if (!submissionsData || submissionsData.length === 0) {
      setSubmissions([]);
      setLoading(false);
      return;
    }

    // Fetch event details for each submission
    const eventIds = [...new Set(submissionsData.map(s => s.event_id))];
    const { data: eventsData } = await supabase
      .from('events')
      .select('id, title, status, poster_url')
      .in('id', eventIds);

    const eventsMap = new Map((eventsData || []).map(e => [e.id, e]));

    const submissionsWithEvents = submissionsData.map(s => ({
      ...s,
      event: eventsMap.get(s.event_id) || undefined
    })) as UserSubmission[];

    setSubmissions(submissionsWithEvents);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSubmissions();

    if (!user) return;

    // Subscribe to realtime updates
    const channel = supabase
      .channel('user-submissions-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'event_participations',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchSubmissions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchSubmissions]);

  return { submissions, loading, refetch: fetchSubmissions };
}
