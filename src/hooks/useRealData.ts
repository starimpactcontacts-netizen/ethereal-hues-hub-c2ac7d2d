import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Types for real data
export interface RealEvent {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  ip: string;
  status: 'live' | 'pending' | 'closed';
  start_date: string;
  end_date: string;
  location: string;
  league: 'open' | 'elite' | 'regional';
  prize_pool: string | null;
  poster_url: string | null;
  rules: string[];
  materials_url: string | null;
  updated_at: string;
}

export interface RealEditor {
  id: string;
  username: string;
  display_name?: string | null;
  league: 'open' | 'pro' | 'elite';
  global_index_score: number;
  win_rate: number;
  total_events: number;
  total_wins: number;
  rank?: number;
  avatar_url?: string | null;
  verification_status?: boolean;
  xp?: number;
  level?: number;
  roles?: ('admin' | 'moderator' | 'user' | 'judge' | 'dev' | 'enterprise')[];
  crew_id?: string | null;
  crew?: {
    id: string;
    name: string;
    emblem: string;
    avatar_url: string | null;
  } | null;
  house_id?: string | null;
  house?: {
    id: string;
    name: string;
    symbol: string;
    primary_color: string;
    secondary_color: string;
  } | null;
}

export interface EventStats {
  entries: number;
  judges: number;
  activeUsers: number;
}

export interface EventParticipation {
  id: string;
  user_id: string;
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
  profile?: {
    username: string;
  };
}

// Hook for fetching real events from database
export function useRealEvents() {
  const [events, setEvents] = useState<RealEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setEvents((data || []) as RealEvent[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEvents();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('events-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        fetchEvents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEvents]);

  return { events, loading, error, refetch: fetchEvents };
}

// Hook for fetching real rankings from profiles
export function useRealRankings() {
  const [rankings, setRankings] = useState<RealEditor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRankings = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id, username, display_name, league, global_index_score, win_rate, total_events, total_wins, avatar_url, verification_status, crew_id, house_id, xp, level,
        crews:crew_id (id, name, emblem, avatar_url),
        houses:house_id (id, name, symbol, primary_color, secondary_color)
      `)
      .order('global_index_score', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      // Fetch roles for all users
      const userIds = (data || []).map(e => e.id);
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      // Build roles map
      const rolesMap = new Map<string, string[]>();
      (rolesData || []).forEach(r => {
        const existing = rolesMap.get(r.user_id) || [];
        existing.push(r.role);
        rolesMap.set(r.user_id, existing);
      });

      // Add rank and roles based on order
      const rankedData = (data || []).map((editor, index) => ({
        ...editor,
        rank: index + 1,
        roles: rolesMap.get(editor.id) || [],
        crew: editor.crews as RealEditor['crew'],
        house: editor.houses as RealEditor['house'],
      })) as RealEditor[];
      setRankings(rankedData);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRankings();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('rankings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchRankings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRankings]);

  return { rankings, loading, error, refetch: fetchRankings };
}

// Hook for event-specific rankings
export function useEventRankings(eventId: string | null) {
  const [rankings, setRankings] = useState<EventParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRankings = useCallback(async () => {
    if (!eventId) {
      setRankings([]);
      setLoading(false);
      return;
    }

    // Fetch participations
    const { data, error: participationsError } = await supabase
      .from('event_participations')
      .select('*')
      .eq('event_id', eventId)
      .order('qoi_score', { ascending: false, nullsFirst: false });

    if (participationsError) {
      setError(participationsError.message);
      setLoading(false);
      return;
    }

    // Fetch profiles for usernames
    if (data && data.length > 0) {
      const userIds = data.map(p => p.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p.username]));
      
      const rankingsWithProfiles = data.map(p => ({
        ...p,
        profile: { username: profileMap.get(p.user_id) || 'Unknown' }
      })) as EventParticipation[];
      
      setRankings(rankingsWithProfiles);
    } else {
      setRankings([]);
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    fetchRankings();

    if (!eventId) return;

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`event-${eventId}-rankings`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'event_participations',
        filter: `event_id=eq.${eventId}`
      }, () => {
        fetchRankings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, fetchRankings]);

  return { rankings, loading, error, refetch: fetchRankings };
}

// Hook for real event statistics
export function useEventStats(eventId: string | null) {
  const [stats, setStats] = useState<EventStats>({ entries: 0, judges: 0, activeUsers: 0 });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!eventId) {
      setStats({ entries: 0, judges: 0, activeUsers: 0 });
      setLoading(false);
      return;
    }

    // Get entries count for this event
    const { count: entriesCount } = await supabase
      .from('event_participations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);

    // Get judges count (admins and moderators)
    const { count: judgesCount } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .in('role', ['admin', 'moderator']);

    // Get active users (last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count: activeCount } = await supabase
      .from('active_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('last_seen', tenMinutesAgo);

    setStats({
      entries: entriesCount || 0,
      judges: judgesCount || 0,
      activeUsers: activeCount || 0,
    });
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    fetchStats();

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);

    return () => clearInterval(interval);
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}

// Hook for global stats (for Hub page)
export function useGlobalStats() {
  const [stats, setStats] = useState<{ entries24h: number; activeUsers: number; totalCompeting: number }>({
    entries24h: 0,
    activeUsers: 0,
    totalCompeting: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    // Get submissions in last 24h
    const { count: entries24h } = await supabase
      .from('event_participations')
      .select('*', { count: 'exact', head: true })
      .gte('submitted_at', twentyFourHoursAgo);

    // Get active users (last 10 minutes)
    const { count: activeUsers } = await supabase
      .from('active_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('last_seen', tenMinutesAgo);

    // Get total users with at least one participation
    const { count: totalCompeting } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gt('total_events', 0);

    setStats({
      entries24h: entries24h || 0,
      activeUsers: activeUsers || 0,
      totalCompeting: totalCompeting || 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}

// Hook to update active session (call on page load)
export function useActiveSession() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const updateSession = async () => {
      await supabase.rpc('update_active_session');
    };

    // Update immediately
    updateSession();

    // Update every 5 minutes
    const interval = setInterval(updateSession, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);
}
