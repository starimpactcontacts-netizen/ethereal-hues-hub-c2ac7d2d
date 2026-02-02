import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserActivityStats {
  totalEvents: number;
  totalWins: number;
  winRate: number;
  loading: boolean;
}

/**
 * Hook to calculate real-time user activity stats from all activity tables.
 * This includes battles, tournaments, events, hosted competitions, etc.
 */
export function useUserActivityStats(userId: string | null | undefined): UserActivityStats {
  const [stats, setStats] = useState<UserActivityStats>({
    totalEvents: 0,
    totalWins: 0,
    winRate: 0,
    loading: true,
  });

  const fetchStats = useCallback(async () => {
    if (!userId) {
      setStats({ totalEvents: 0, totalWins: 0, winRate: 0, loading: false });
      return;
    }

    try {
      // Fetch all activity in parallel
      const [
        eventParts,
        roundParts,
        hostedSubs,
        battlesData,
        friendlyTournaments,
        sanctionedTournaments,
        hostedWins,
        eventWins,
        friendlyWins,
        sanctionedWins,
      ] = await Promise.all([
        // Official event participations
        supabase
          .from('event_participations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        // Open arena round participations
        supabase
          .from('round_participations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        // Hosted competition submissions
        supabase
          .from('hosted_competition_submissions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        // Battles (completed)
        supabase
          .from('battles')
          .select('challenger_id, opponent_id, winner_id')
          .eq('status', 'completed')
          .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`),
        // Friendly tournaments
        supabase
          .from('friendly_tournament_participants')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        // Sanctioned tournaments
        supabase
          .from('sanctioned_tournament_participants')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        // Hosted comp wins (1st place)
        supabase
          .from('hosted_competition_submissions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('winner_place', 1),
        // Official event wins (final_rank = 1)
        supabase
          .from('event_participations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('final_rank', 1),
        // Friendly tournament wins
        supabase
          .from('friendly_tournament_participants')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('final_rank', 1),
        // Sanctioned tournament wins (final_rank = 1)
        supabase
          .from('sanctioned_tournament_participants')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('final_rank', 1),
      ]);

      // Count battle participations and wins
      const battles = battlesData.data || [];
      const battleCount = battles.length;
      const battleWins = battles.filter(b => b.winner_id === userId).length;

      // Total events = all participations across all tables
      const totalEvents =
        (eventParts.count || 0) +
        (roundParts.count || 0) +
        (hostedSubs.count || 0) +
        battleCount +
        (friendlyTournaments.count || 0) +
        (sanctionedTournaments.count || 0);

      // Total wins = battles won + tournament 1st places + event 1st places
      const totalWins =
        battleWins +
        (hostedWins.count || 0) +
        (eventWins.count || 0) +
        (friendlyWins.count || 0) +
        (sanctionedWins.count || 0);

      // Win rate = total wins / total events
      const winRate = totalEvents > 0 ? (totalWins / totalEvents) * 100 : 0;

      setStats({
        totalEvents,
        totalWins,
        winRate,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching user activity stats:', error);
      setStats({ totalEvents: 0, totalWins: 0, winRate: 0, loading: false });
    }
  }, [userId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return stats;
}
