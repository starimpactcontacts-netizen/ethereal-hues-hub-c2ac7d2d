import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Types for real data
export interface RealEvent {
  id: string;
  slug: string | null;
  title: string;
  subtitle: string | null;
  description: string | null;
  ip: string;
  category: string | null;
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
  event_mode: 'standard' | 'open_arena' | null;
  total_rounds: number | null;
  max_editors: number | null;
  winner_logic: 'final_qoi' | 'cumulative_qoi' | 'manual' | null;
}

/** Get the clean URL identifier for an event (slug preferred, fallback to id) */
export function getEventSlug(event: { slug?: string | null; id: string }) {
  return event.slug || event.id;
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
  best_gatekeeper_qoi?: number | null;
  is_founding_member?: boolean;
  created_at?: string | null;
  connection_count?: number;
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
        id, username, display_name, league, global_index_score, win_rate, total_events, total_wins, avatar_url, verification_status, crew_id, house_id, xp, level, best_gatekeeper_qoi, is_founding_member, created_at, connection_count,
        crews:crew_id (id, name, emblem, avatar_url),
        houses:house_id (id, name, symbol, primary_color, secondary_color)
      `)
      .eq('is_hidden', false)
      .order('global_index_score', { ascending: false })
      .order('best_gatekeeper_qoi', { ascending: false, nullsFirst: false })
      .order('level', { ascending: false })
      .order('xp', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      // Fetch roles for all users
      const userIds = (data || []).map(e => e.id);
      
      // Fetch all user activity stats in parallel
      const [rolesResult, roundParticipationsResult, battlesResult, hostedSubsResult, eventParticipationsResult, hostedWinnersResult, friendlyTournamentResult, sanctionedTournamentResult] = await Promise.all([
        // User roles
        supabase.from('user_roles').select('user_id, role').in('user_id', userIds),
        // Round participations (Open Arena events)
        supabase.from('round_participations').select('user_id, qoi_score').in('user_id', userIds),
        // Battles (completed with winner)
        supabase.from('battles').select('challenger_id, opponent_id, winner_id').eq('status', 'completed'),
        // Hosted competition submissions
        supabase.from('hosted_competition_submissions').select('user_id, is_winner, winner_place').in('user_id', userIds),
        // Official event participations (old-style events)
        supabase.from('event_participations').select('user_id, final_rank').in('user_id', userIds),
        // Hosted competition winners (1st place)
        supabase.from('hosted_competition_submissions').select('user_id').in('user_id', userIds).eq('winner_place', 1),
        // Friendly tournament participants
        supabase.from('friendly_tournament_participants').select('user_id, final_rank').in('user_id', userIds),
        // Sanctioned tournament participants (THE MAIN TOURNAMENT SYSTEM!)
        supabase.from('sanctioned_tournament_participants').select('user_id, final_rank').in('user_id', userIds),
      ]);

      // Build roles map
      const rolesMap = new Map<string, string[]>();
      (rolesResult.data || []).forEach(r => {
        const existing = rolesMap.get(r.user_id) || [];
        existing.push(r.role);
        rolesMap.set(r.user_id, existing);
      });

      // Build event participation counts (unique events per user)
      const eventCountMap = new Map<string, number>();
      // Round participations (open arena)
      (roundParticipationsResult.data || []).forEach(p => {
        eventCountMap.set(p.user_id, (eventCountMap.get(p.user_id) || 0) + 1);
      });
      // Hosted competition submissions
      (hostedSubsResult.data || []).forEach(p => {
        eventCountMap.set(p.user_id, (eventCountMap.get(p.user_id) || 0) + 1);
      });
      // Official event participations
      (eventParticipationsResult.data || []).forEach(p => {
        eventCountMap.set(p.user_id, (eventCountMap.get(p.user_id) || 0) + 1);
      });
      // Friendly tournament participations
      (friendlyTournamentResult.data || []).forEach(p => {
        eventCountMap.set(p.user_id, (eventCountMap.get(p.user_id) || 0) + 1);
      });
      // Sanctioned tournament participations
      (sanctionedTournamentResult.data || []).forEach(p => {
        eventCountMap.set(p.user_id, (eventCountMap.get(p.user_id) || 0) + 1);
      });

      // Build battle stats (wins and total battles)
      const battleWinsMap = new Map<string, number>();
      const battleCountMap = new Map<string, number>();
      (battlesResult.data || []).forEach(b => {
        // Count battles for both participants
        if (b.challenger_id) {
          battleCountMap.set(b.challenger_id, (battleCountMap.get(b.challenger_id) || 0) + 1);
        }
        if (b.opponent_id) {
          battleCountMap.set(b.opponent_id, (battleCountMap.get(b.opponent_id) || 0) + 1);
        }
        // Count wins
        if (b.winner_id) {
          battleWinsMap.set(b.winner_id, (battleWinsMap.get(b.winner_id) || 0) + 1);
        }
      });

      // Count all wins: battles + official events (rank 1) + hosted comps (winner_place 1) + tournaments
      const totalWinsMap = new Map<string, number>();
      
      // Battle wins
      battleWinsMap.forEach((wins, oderId) => {
        totalWinsMap.set(oderId, (totalWinsMap.get(oderId) || 0) + wins);
      });
      
      // Official event wins (final_rank = 1)
      (eventParticipationsResult.data || []).forEach(p => {
        if (p.final_rank === 1) {
          totalWinsMap.set(p.user_id, (totalWinsMap.get(p.user_id) || 0) + 1);
        }
      });
      
      // Hosted competition wins (winner_place = 1)
      (hostedWinnersResult.data || []).forEach(p => {
        totalWinsMap.set(p.user_id, (totalWinsMap.get(p.user_id) || 0) + 1);
      });
      
      // Friendly tournament wins (final_rank = 1)
      (friendlyTournamentResult.data || []).forEach(p => {
        if (p.final_rank === 1) {
          totalWinsMap.set(p.user_id, (totalWinsMap.get(p.user_id) || 0) + 1);
        }
      });
      
      // Sanctioned tournament wins (final_rank = 1) - THIS IS THE KEY ONE!
      (sanctionedTournamentResult.data || []).forEach(p => {
        if (p.final_rank === 1) {
          totalWinsMap.set(p.user_id, (totalWinsMap.get(p.user_id) || 0) + 1);
        }
      });

      // Add rank and roles based on order
      const rankedData = (data || []).map((editor, index) => {
        const eventCount = eventCountMap.get(editor.id) || 0;
        const battleCount = battleCountMap.get(editor.id) || 0;
        const totalEvents = eventCount + battleCount;
        const totalWins = totalWinsMap.get(editor.id) || 0;
        
        // Win rate = total wins / total events (if they have events)
        const winRate = totalEvents > 0 ? (totalWins / totalEvents) * 100 : 0;
        
        return {
          ...editor,
          rank: index + 1,
          roles: rolesMap.get(editor.id) || [],
          crew: editor.crews as RealEditor['crew'],
          house: editor.houses as RealEditor['house'],
          total_events: totalEvents,
          total_wins: totalWins,
          win_rate: winRate,
          connection_count: editor.connection_count || 0,
        };
      }) as RealEditor[];
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

// Hook for event-specific rankings (supports both standard and Open Arena events)
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

    // Fetch standard event participations
    const { data: standardData, error: standardError } = await supabase
      .from('event_participations')
      .select('*')
      .eq('event_id', eventId)
      .order('qoi_score', { ascending: false, nullsFirst: false });

    // Fetch Open Arena round participations
    const { data: roundData, error: roundError } = await supabase
      .from('round_participations')
      .select('*')
      .eq('event_id', eventId)
      .not('submission_url', 'is', null)
      .order('qoi_score', { ascending: false, nullsFirst: false });

    if (standardError) {
      setError(standardError.message);
    }
    if (roundError && !standardError) {
      setError(roundError.message);
    }

    // Merge both types - use standard if available, otherwise round participations
    const allData = [
      ...(standardData || []).map(p => ({
        id: p.id,
        user_id: p.user_id,
        event_id: p.event_id,
        submission_url: p.submission_url,
        platform: p.platform,
        status: p.status,
        quality_score: p.quality_score,
        originality_score: p.originality_score,
        impact_score: p.impact_score,
        qoi_score: p.qoi_score,
        final_rank: p.final_rank,
        submitted_at: p.submitted_at,
      })),
      ...(roundData || []).map(p => ({
        id: p.id,
        user_id: p.user_id,
        event_id: p.event_id,
        submission_url: p.submission_url!,
        platform: p.platform || 'tiktok',
        status: p.status || 'pending',
        quality_score: p.quality_score,
        originality_score: p.originality_score,
        impact_score: p.impact_score,
        qoi_score: p.qoi_score,
        final_rank: null,
        submitted_at: p.submitted_at || p.created_at,
      })),
    ];

    // Deduplicate by user_id (keep highest qoi_score)
    const userMap = new Map<string, typeof allData[0]>();
    allData.forEach(p => {
      const existing = userMap.get(p.user_id);
      if (!existing || (p.qoi_score || 0) > (existing.qoi_score || 0)) {
        userMap.set(p.user_id, p);
      }
    });
    const dedupedData = Array.from(userMap.values());

    // Sort by qoi_score descending
    dedupedData.sort((a, b) => (b.qoi_score || 0) - (a.qoi_score || 0));

    // Fetch profiles for usernames
    if (dedupedData.length > 0) {
      const userIds = dedupedData.map(p => p.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p.username]));
      
      const rankingsWithProfiles = dedupedData.map(p => ({
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

    // Subscribe to realtime updates for both tables
    const standardChannel = supabase
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

    const roundChannel = supabase
      .channel(`event-${eventId}-round-rankings`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'round_participations',
        filter: `event_id=eq.${eventId}`
      }, () => {
        fetchRankings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(standardChannel);
      supabase.removeChannel(roundChannel);
    };
  }, [eventId, fetchRankings]);

  return { rankings, loading, error, refetch: fetchRankings };
}

// Hook for real event statistics (counts both standard and Open Arena submissions)
export function useEventStats(eventId: string | null) {
  const [stats, setStats] = useState<EventStats>({ entries: 0, judges: 0, activeUsers: 0 });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!eventId) {
      setStats({ entries: 0, judges: 0, activeUsers: 0 });
      setLoading(false);
      return;
    }

    // Get standard entries count for this event
    const { count: standardCount } = await supabase
      .from('event_participations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);

    // Get Open Arena round entries count
    const { count: roundCount } = await supabase
      .from('round_participations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .not('submission_url', 'is', null);

    // Get judges count (admins and moderators)
    const { count: judgesCount } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .in('role', ['admin', 'moderator', 'judge']);

    // Get active users (last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count: activeCount } = await supabase
      .from('active_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('last_seen', tenMinutesAgo);

    setStats({
      entries: (standardCount || 0) + (roundCount || 0),
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

// Hook for global stats (for Hub page) - aggregates ALL platform activity
export function useGlobalStats() {
  const [stats, setStats] = useState<{ entries24h: number; entriesLabel: string; activeUsers: number; totalCompeting: number }>({
    entries24h: 0,
    entriesLabel: '24h',
    activeUsers: 0,
    totalCompeting: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    // Fetch all activity counts in parallel
    const [
      standardEntries,
      roundEntries,
      sanctionedParticipants,
      reviewRequests,
      battles,
      gqtSubmissions,
      activeSessions,
      onlineStatusUsers,
      sanctionedCompeting,
      battleCompeting
    ] = await Promise.all([
      // Standard event submissions in last 24h
      supabase
        .from('event_participations')
        .select('*', { count: 'exact', head: true })
        .gte('submitted_at', twentyFourHoursAgo),
      
      // Open Arena round submissions in last 24h
      supabase
        .from('round_participations')
        .select('*', { count: 'exact', head: true })
        .not('submission_url', 'is', null)
        .gte('submitted_at', twentyFourHoursAgo),
      
      // Sanctioned tournament joins in last 24h
      supabase
        .from('sanctioned_tournament_participants')
        .select('*', { count: 'exact', head: true })
        .gte('joined_at', twentyFourHoursAgo),
      
      // Review requests (Get Feedback) in last 24h
      supabase
        .from('review_requests')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', twentyFourHoursAgo),
      
      // 1v1 Battles created in last 24h
      supabase
        .from('battles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', twentyFourHoursAgo),
      
      // GQT submissions in last 24h
      supabase
        .from('gatekeeper_submissions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', twentyFourHoursAgo),
      
      // Active users (last 10 minutes from sessions)
      supabase
        .from('active_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen', tenMinutesAgo),
      
      // Users with activity_status set to online
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('activity_status', 'online')
        .eq('is_banned', false)
        .eq('is_hidden', false),
      
      // Users in active sanctioned tournaments (lobby, ready_up, live, bracket)
      supabase
        .from('sanctioned_tournament_participants')
        .select('user_id', { count: 'exact', head: true }),
      
      // Users in active battles
      supabase
        .from('battles')
        .select('challenger_id', { count: 'exact', head: true })
        .in('status', ['pending', 'active', 'judging'])
    ]);

    // Sum all entries for last 24h
    const totalEntries = 
      (standardEntries.count || 0) + 
      (roundEntries.count || 0) + 
      (sanctionedParticipants.count || 0) + 
      (reviewRequests.count || 0) + 
      (battles.count || 0) + 
      (gqtSubmissions.count || 0);

    // If 24h is 0, try 7-day window
    let finalEntries = totalEntries;
    let entriesLabel = '24h';
    
    if (totalEntries === 0) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [e7, r7, s7, rv7, b7, g7] = await Promise.all([
        supabase.from('event_participations').select('*', { count: 'exact', head: true }).gte('submitted_at', sevenDaysAgo),
        supabase.from('round_participations').select('*', { count: 'exact', head: true }).not('submission_url', 'is', null).gte('submitted_at', sevenDaysAgo),
        supabase.from('sanctioned_tournament_participants').select('*', { count: 'exact', head: true }).gte('joined_at', sevenDaysAgo),
        supabase.from('review_requests').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
        supabase.from('battles').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
        supabase.from('gatekeeper_submissions').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
      ]);
      const weekTotal = (e7.count||0)+(r7.count||0)+(s7.count||0)+(rv7.count||0)+(b7.count||0)+(g7.count||0);
      if (weekTotal > 0) {
        finalEntries = weekTotal;
        entriesLabel = '7d';
      }
    }

    // Total competing = sanctioned + battle participants (unique-ish approximation)
    const totalCompeting = 
      (sanctionedCompeting.count || 0) + 
      (battleCompeting.count || 0);

    // Active now = max of session-based activity or users with online status set
    const activeNow = Math.max(
      activeSessions.count || 0,
      onlineStatusUsers.count || 0
    );

    setStats({
      entries24h: finalEntries,
      entriesLabel,
      activeUsers: activeNow,
      totalCompeting: totalCompeting,
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

    const getDeviceName = () => {
      const ua = navigator.userAgent;
      if (/iPhone/i.test(ua)) return 'iPhone';
      if (/iPad/i.test(ua)) return 'iPad';
      if (/Android/i.test(ua)) return 'Android';
      if (/Mac/i.test(ua)) return 'Mac';
      if (/Windows/i.test(ua)) return 'Windows';
      if (/Linux/i.test(ua)) return 'Linux';
      return 'Unknown Device';
    };

    const updateSession = async () => {
      // Use existing RPC to update/create session
      await supabase.rpc('update_active_session');
      // Then update device info on matching row
      await supabase
        .from('active_sessions')
        .update({
          device_name: getDeviceName(),
          user_agent: navigator.userAgent.substring(0, 255),
        } as any)
        .eq('user_id', user.id);
    };

    updateSession();
    const interval = setInterval(updateSession, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);
}
