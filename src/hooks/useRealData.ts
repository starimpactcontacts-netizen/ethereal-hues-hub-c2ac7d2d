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
  total_battles?: number;
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
  thumbnail_url?: string | null;
  custom_title?: string | null;
  author_username?: string | null;
  view_count?: number | null;
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
  const [totalEditors, setTotalEditors] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRankings = useCallback(async () => {
    const [rankingsResult, countResult] = await Promise.all([
      supabase
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
        .order('xp', { ascending: false })
        .range(0, 49999),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_hidden', false),
    ]);

    const { data, error } = rankingsResult;
    if (!countResult.error) {
      setTotalEditors(countResult.count ?? (data || []).length);
    }

    if (error) {
      setError(error.message);
    } else {
      // Fetch roles for all users
      const userIds = (data || []).map(e => e.id);
      
      // Fetch all user activity stats in parallel. League stats must include every
      // competitive lane: edit battles, quick fights, cash battles, duo/collab battles,
      // competitions, hosted comps, official events, and tournaments.
      const [
        rolesResult,
        roundParticipationsResult,
        battlesResult,
        quickFightsResult,
        cashBattlesResult,
        hostedSubsResult,
        hostedParticipantsResult,
        competitionSubsResult,
        competitionParticipantsResult,
        eventParticipationsResult,
        friendlyTournamentResult,
        sanctionedTournamentResult,
        collabBattlesResult,
      ] = await Promise.all([
        // User roles
        supabase.from('user_roles').select('user_id, role').in('user_id', userIds),
        // Round participations (Open Arena events)
        supabase.from('round_participations').select('user_id, event_id').in('user_id', userIds),
        // Standard edit battles
        supabase.from('battles').select('id, challenger_id, opponent_id, winner_id, status').neq('status', 'cancelled').not('opponent_id', 'is', null),
        // Quick edit battles
        supabase.from('quick_fights').select('id, player_1_id, player_2_id, winner_id, status').neq('status', 'cancelled').not('player_2_id', 'is', null),
        // Cash battles
        supabase.from('cash_battles').select('id, challenger_id, opponent_id, winner_id, status').neq('status', 'cancelled').not('opponent_id', 'is', null),
        // Hosted competition submissions
        supabase.from('hosted_competition_submissions').select('user_id, competition_id, is_winner, winner_place, final_rank').in('user_id', userIds),
        // Hosted competition joins without submitted edits
        supabase.from('hosted_competition_participants').select('user_id, competition_id').in('user_id', userIds),
        // New Arena competition submissions
        supabase.from('competition_submissions').select('user_id, competition_id, is_winner, winner_place').in('user_id', userIds),
        // New Arena competition joins without submitted edits
        supabase.from('competition_participants').select('user_id, competition_id').in('user_id', userIds),
        // Official event participations (old-style events)
        supabase.from('event_participations').select('user_id, event_id, final_rank').in('user_id', userIds),
        // Friendly tournament participants
        supabase.from('friendly_tournament_participants').select('user_id, tournament_id, final_rank').in('user_id', userIds),
        // Sanctioned tournament participants (THE MAIN TOURNAMENT SYSTEM!)
        supabase.from('sanctioned_tournament_participants').select('user_id, tournament_id, final_rank').in('user_id', userIds),
        // Duo/collab battles; participant ids are resolved through collab_slots below
        supabase.from('collab_battles').select('id, slot_a_id, slot_b_id, winner_slot_id, status'),
      ]);

      const collabSlotIds = Array.from(new Set(
        ((collabBattlesResult.data || []) as Array<{ slot_a_id: string; slot_b_id: string; winner_slot_id: string | null }>).flatMap(b => [b.slot_a_id, b.slot_b_id, b.winner_slot_id].filter(Boolean) as string[])
      ));
      const collabSlotsResult = collabSlotIds.length
        ? await supabase.from('collab_slots').select('id, creator_id, partner_id').in('id', collabSlotIds)
        : { data: [] as Array<{ id: string; creator_id: string; partner_id: string | null }> };

      // Build roles map
      const rolesMap = new Map<string, string[]>();
      (rolesResult.data || []).forEach(r => {
        const existing = rolesMap.get(r.user_id) || [];
        existing.push(r.role);
        rolesMap.set(r.user_id, existing);
      });

      // Build participation, battle, and win maps. Sets prevent a joined+submitted
      // competition from being counted twice for the same editor.
      const participationMap = new Map<string, Set<string>>();
      const battleWinsMap = new Map<string, number>();
      const battleCountMap = new Map<string, number>();
      const totalWinsMap = new Map<string, Set<string>>();

      const addParticipation = (userId: string | null | undefined, key: string) => {
        if (!userId) return;
        const set = participationMap.get(userId) || new Set<string>();
        set.add(key);
        participationMap.set(userId, set);
      };
      const addBattle = (userId: string | null | undefined) => {
        if (!userId) return;
        battleCountMap.set(userId, (battleCountMap.get(userId) || 0) + 1);
      };
      const addWin = (userId: string | null | undefined, key: string) => {
        if (!userId) return;
        const set = totalWinsMap.get(userId) || new Set<string>();
        set.add(key);
        totalWinsMap.set(userId, set);
      };
      const addBattleWin = (userId: string | null | undefined, key: string) => {
        if (!userId) return;
        battleWinsMap.set(userId, (battleWinsMap.get(userId) || 0) + 1);
        addWin(userId, key);
      };

      (roundParticipationsResult.data || []).forEach(p => addParticipation(p.user_id, `round:${p.event_id}`));
      (hostedParticipantsResult.data || []).forEach(p => addParticipation(p.user_id, `hosted:${p.competition_id}`));
      (hostedSubsResult.data || []).forEach(p => {
        addParticipation(p.user_id, `hosted:${p.competition_id}`);
        if (p.winner_place === 1 || p.final_rank === 1 || p.is_winner) addWin(p.user_id, `hosted:${p.competition_id}`);
      });
      (competitionParticipantsResult.data || []).forEach(p => addParticipation(p.user_id, `competition:${p.competition_id}`));
      (competitionSubsResult.data || []).forEach(p => {
        addParticipation(p.user_id, `competition:${p.competition_id}`);
        if (p.winner_place === 1 || p.is_winner) addWin(p.user_id, `competition:${p.competition_id}`);
      });
      (eventParticipationsResult.data || []).forEach(p => {
        addParticipation(p.user_id, `event:${p.event_id}`);
        if (p.final_rank === 1) addWin(p.user_id, `event:${p.event_id}`);
      });
      (friendlyTournamentResult.data || []).forEach(p => {
        addParticipation(p.user_id, `friendly:${p.tournament_id}`);
        if (p.final_rank === 1) addWin(p.user_id, `friendly:${p.tournament_id}`);
      });
      (sanctionedTournamentResult.data || []).forEach(p => {
        addParticipation(p.user_id, `sanctioned:${p.tournament_id}`);
        if (p.final_rank === 1) addWin(p.user_id, `sanctioned:${p.tournament_id}`);
      });

      (battlesResult.data || []).forEach(b => {
        addBattle(b.challenger_id);
        addBattle(b.opponent_id);
        if (b.winner_id) addBattleWin(b.winner_id, `battle:${b.id}`);
      });
      (quickFightsResult.data || []).forEach(f => {
        addBattle(f.player_1_id);
        addBattle(f.player_2_id);
        if (f.winner_id) addBattleWin(f.winner_id, `quick:${f.id}`);
      });
      (cashBattlesResult.data || []).forEach(b => {
        addBattle(b.challenger_id);
        addBattle(b.opponent_id);
        if (b.winner_id) addBattleWin(b.winner_id, `cash:${b.id}`);
      });

      const collabSlotMap = new Map<string, { creator_id: string; partner_id: string | null }>();
      ((collabSlotsResult.data || []) as Array<{ id: string; creator_id: string; partner_id: string | null }>).forEach(slot => {
        collabSlotMap.set(slot.id, { creator_id: slot.creator_id, partner_id: slot.partner_id });
      });
      const addDuoSlotBattle = (slotId: string | null | undefined) => {
        const slot = slotId ? collabSlotMap.get(slotId) : null;
        if (!slot) return;
        addBattle(slot.creator_id);
        addBattle(slot.partner_id);
      };
      const addDuoSlotWin = (slotId: string | null | undefined, battleId: string) => {
        const slot = slotId ? collabSlotMap.get(slotId) : null;
        if (!slot) return;
        addBattleWin(slot.creator_id, `duo:${battleId}`);
        addBattleWin(slot.partner_id, `duo:${battleId}`);
      };
      (collabBattlesResult.data || []).forEach(b => {
        addDuoSlotBattle(b.slot_a_id);
        addDuoSlotBattle(b.slot_b_id);
        addDuoSlotWin(b.winner_slot_id, b.id);
      });

      // Add rank and roles based on order
      const rankedData = (data || []).map((editor, index) => {
        const eventCount = participationMap.get(editor.id)?.size || 0;
        const battleCount = battleCountMap.get(editor.id) || 0;
        const totalEvents = eventCount + battleCount;
        const totalWins = totalWinsMap.get(editor.id)?.size || 0;
        
        // Win rate = total wins / total events (if they have events)
        const winRate = totalEvents > 0 ? (totalWins / totalEvents) * 100 : 0;
        
        return {
          ...editor,
          rank: index + 1,
          roles: rolesMap.get(editor.id) || [],
          crew: editor.crews as RealEditor['crew'],
          house: editor.houses as RealEditor['house'],
          total_events: totalEvents,
          total_battles: battleCount,
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

    // Subscribe to realtime updates (debounced — profiles update constantly
    // as XP/score changes, so coalesce bursts into a single refetch)
    let timer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefetch = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        fetchRankings();
      }, 30000);
    };
    const channel = supabase
      .channel('rankings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        scheduleRefetch();
      })
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [fetchRankings]);

  return { rankings, totalEditors, loading, error, refetch: fetchRankings };
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
      .not('status', 'in', '(rejected,declined,eliminated)')
      .order('qoi_score', { ascending: false, nullsFirst: false });

    // Fetch Open Arena round participations
    const { data: roundData, error: roundError } = await supabase
      .from('round_participations')
      .select('*')
      .eq('event_id', eventId)
      .not('submission_url', 'is', null)
      .not('status', 'in', '(eliminated,rejected,declined)')
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
        thumbnail_url: p.thumbnail_url,
        custom_title: p.custom_title,
        author_username: p.author_username,
        view_count: p.view_count,
        is_showcase: (p as any).is_showcase ?? false,
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
        thumbnail_url: p.thumbnail_url,
        custom_title: p.custom_title,
        author_username: p.author_username,
        view_count: p.view_count,
        is_showcase: (p as any).is_showcase ?? false,
      })),
    ];

    // Deduplicate ranked entries by user_id (keep highest qoi_score),
    // but KEEP every showcase row — admins can upload multiple inspo drops per event.
    const showcaseRows = allData.filter(p => (p as any).is_showcase);
    const rankedRows = allData.filter(p => !(p as any).is_showcase);
    const userMap = new Map<string, typeof allData[0]>();
    rankedRows.forEach(p => {
      const existing = userMap.get(p.user_id);
      if (!existing || (p.qoi_score || 0) > (existing.qoi_score || 0)) {
        userMap.set(p.user_id, p);
      }
    });
    const dedupedData = [...Array.from(userMap.values()), ...showcaseRows];

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

    // Refresh every 3 minutes (was 30s — that fired 4 COUNT queries per user
    // per 30s and was the top DB burner). Stats don't move meaningfully faster.
    // Also refetch immediately when tab becomes visible so it still feels live.
    const interval = setInterval(fetchStats, 180000);
    const onVis = () => { if (document.visibilityState === 'visible') fetchStats(); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}

// Hook for global stats (for Hub page) - aggregates ALL platform activity
export function useGlobalStats() {
  const [stats, setStats] = useState<{ entries24h: number; entriesLabel: string; activeUsers: number; totalCompeting: number; totalEditors: number }>({
    entries24h: 0,
    entriesLabel: '24h',
    activeUsers: 0,
    totalCompeting: 0,
    totalEditors: 0,
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
      compParticipants,
      quickFightPlayers,
      totalProfilesResult,
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
      
      // All competition participants ever
      supabase
        .from('competition_participants')
        .select('user_id')
        .limit(10000),

      // All completed/active quick fights (edit battles) ever
      supabase
        .from('quick_fights')
        .select('player_1_id, player_2_id')
        .neq('status', 'cancelled')
        .not('player_2_id', 'is', null)
        .limit(10000),

      // Total registered editors (profiles)
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_banned', false)
        .eq('is_hidden', false),
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

    // Distinct users who have ever competed in a competition or edit battle
    const uniqueCompetitorIds = new Set([
      ...(compParticipants.data?.map((r: any) => r.user_id) || []),
      ...(quickFightPlayers.data?.flatMap((r: any) => [r.player_1_id, r.player_2_id].filter(Boolean)) || []),
    ]);
    const totalCompeting = uniqueCompetitorIds.size;

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
      totalEditors: totalProfilesResult.count || 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
    // Was 30s × 10 parallel COUNTs per user — single biggest cloud cost.
    // 5 min interval + visibility-driven refresh keeps the Hub feeling live
    // without grinding the DB. Realtime channels still update entry counts.
    const interval = setInterval(fetchStats, 300000);
    const onVis = () => { if (document.visibilityState === 'visible') fetchStats(); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVis);
    };
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
      // Skip the heartbeat entirely while the tab is hidden — no point marking
      // someone "active" when their browser is backgrounded.
      if (document.visibilityState === 'hidden') return;
      // Use existing RPC to update/create session
      await supabase.rpc('update_active_session');
    };

    // Device info never changes mid-session — write it once on mount, not
    // every 5 minutes (was doubling the write count on this table).
    const writeDeviceInfo = async () => {
      await supabase.rpc('update_active_session');
      await supabase
        .from('active_sessions')
        .update({
          device_name: getDeviceName(),
          user_agent: navigator.userAgent.substring(0, 255),
        } as any)
        .eq('user_id', user.id);
    };
    writeDeviceInfo();
    const interval = setInterval(updateSession, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);
}
