import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface EventRound {
  id: string;
  event_id: string;
  round_number: number;
  round_type: 'open' | 'elimination' | 'threshold';
  advancement_type: 'top_x' | 'percentage' | 'manual' | 'none';
  advancement_value: number | null;
  threshold_qoi: number | null;
  max_submissions: number;
  index_reward: number;
  bonus_multiplier: number;
  duration_hours: number;
  auto_start_next: boolean;
  show_leaderboard: boolean;
  status: 'pending' | 'active' | 'completed';
  starts_at: string | null;
  ends_at: string | null;
}

export interface UserRoundStatus {
  round_number: number;
  status: 'active' | 'advanced' | 'eliminated' | 'pending';
  qoi_score: number | null;
  submission_url: string | null;
  submitted_at: string | null;
}

export function useEventRounds(eventId: string | null) {
  const [rounds, setRounds] = useState<EventRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRounds = useCallback(async () => {
    if (!eventId) {
      setRounds([]);
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from('event_rounds')
      .select('*')
      .eq('event_id', eventId)
      .order('round_number');

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setRounds((data || []) as EventRound[]);
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    fetchRounds();

    if (!eventId) return;

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`event-rounds-${eventId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'event_rounds',
        filter: `event_id=eq.${eventId}`,
      }, () => {
        fetchRounds();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, fetchRounds]);

  return { rounds, loading, error, refetch: fetchRounds };
}

export function useUserRoundStatus(eventId: string | null) {
  const { user } = useAuth();
  const [statuses, setStatuses] = useState<UserRoundStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    if (!eventId || !user) {
      setStatuses([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('round_participations')
      .select('round_number, status, qoi_score, submission_url, submitted_at')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .order('round_number');

    if (!error && data) {
      setStatuses(data as UserRoundStatus[]);
    }
    setLoading(false);
  }, [eventId, user]);

  useEffect(() => {
    fetchStatus();

    if (!eventId || !user) return;

    const channel = supabase
      .channel(`user-rounds-${eventId}-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'round_participations',
        filter: `event_id=eq.${eventId}`,
      }, () => {
        fetchStatus();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, user, fetchStatus]);

  return { statuses, loading, refetch: fetchStatus };
}

export function useRoundParticipantCount(eventId: string | null, roundNumber: number) {
  const [count, setCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    if (!eventId) return;

    const fetchCount = async () => {
      const { count: totalCount } = await supabase
        .from('round_participations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('round_number', roundNumber);

      const { count: active } = await supabase
        .from('round_participations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('round_number', roundNumber)
        .in('status', ['active', 'advanced']);

      setCount(totalCount || 0);
      setActiveCount(active || 0);
    };

    fetchCount();
  }, [eventId, roundNumber]);

  return { count, activeCount };
}
