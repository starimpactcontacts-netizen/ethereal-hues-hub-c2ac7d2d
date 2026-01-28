import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface JudgeLeaderboardEntry {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  judge_xp: number;
  judge_review_count: number;
  judge_level: number;
  verification_status: boolean;
  judge_badge: string | null;
  weeklyReviews: number;
  rank?: number;
}

// Judge XP thresholds for levels (10 levels like editor XP)
export const JUDGE_XP_LEVELS = [
  { level: 1, xpRequired: 0, perk: null },
  { level: 2, xpRequired: 100, perk: null },
  { level: 3, xpRequired: 300, perk: 'Faster queue priority' },
  { level: 4, xpRequired: 600, perk: null },
  { level: 5, xpRequired: 1000, perk: 'Featured spot on Judge Hub' },
  { level: 6, xpRequired: 1500, perk: 'Custom badge color' },
  { level: 7, xpRequired: 2200, perk: null },
  { level: 8, xpRequired: 3200, perk: 'Early access to special requests' },
  { level: 9, xpRequired: 4500, perk: null },
  { level: 10, xpRequired: 7000, perk: 'Elite Judge role + Tournament invites' },
];

export function calculateJudgeLevel(judgeXp: number): number {
  for (let i = JUDGE_XP_LEVELS.length - 1; i >= 0; i--) {
    if (judgeXp >= JUDGE_XP_LEVELS[i].xpRequired) {
      return JUDGE_XP_LEVELS[i].level;
    }
  }
  return 1;
}

export function getJudgeXPForNextLevel(currentLevel: number): number {
  if (currentLevel >= 10) return JUDGE_XP_LEVELS[9].xpRequired;
  return JUDGE_XP_LEVELS[currentLevel].xpRequired;
}

export function getJudgeLevelPerk(level: number): string | null {
  return JUDGE_XP_LEVELS.find(l => l.level === level)?.perk || null;
}

export function useJudgeLeaderboard(mode: 'weekly' | 'alltime' = 'alltime', limit: number = 20) {
  const [judges, setJudges] = useState<JudgeLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [mode, limit]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      // Get all judge user IDs
      const { data: judgeRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['judge', 'trial_judge']);

      if (!judgeRoles?.length) {
        setJudges([]);
        setLoading(false);
        return;
      }

      const judgeIds = judgeRoles.map(r => r.user_id);

      // Fetch judge profiles with new judge_xp fields
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, judge_xp, judge_review_count, verification_status, judge_badge')
        .in('id', judgeIds)
        .eq('is_banned', false)
        .eq('is_hidden', false);

      if (!profiles) {
        setJudges([]);
        setLoading(false);
        return;
      }

      // Get weekly review counts if needed
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data: weeklyReviews } = await supabase
        .from('review_requests')
        .select('judge_id')
        .eq('status', 'reviewed')
        .in('judge_id', judgeIds)
        .gte('reviewed_at', oneWeekAgo.toISOString());

      // Count weekly reviews per judge
      const weeklyCountMap: Record<string, number> = {};
      (weeklyReviews || []).forEach(r => {
        if (r.judge_id) {
          weeklyCountMap[r.judge_id] = (weeklyCountMap[r.judge_id] || 0) + 1;
        }
      });

      // Build leaderboard entries
      const entries: JudgeLeaderboardEntry[] = profiles.map(p => ({
        ...p,
        judge_xp: p.judge_xp || 0,
        judge_review_count: p.judge_review_count || 0,
        judge_level: calculateJudgeLevel(p.judge_xp || 0),
        weeklyReviews: weeklyCountMap[p.id] || 0,
      }));

      // Sort based on mode
      const sorted = entries.sort((a, b) => {
        if (mode === 'weekly') {
          return b.weeklyReviews - a.weeklyReviews || b.judge_xp - a.judge_xp;
        }
        return b.judge_xp - a.judge_xp || b.judge_review_count - a.judge_review_count;
      });

      // Add ranks and limit
      const ranked = sorted.slice(0, limit).map((j, i) => ({ ...j, rank: i + 1 }));

      setJudges(ranked);
    } catch (error) {
      console.error('Error fetching judge leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return { judges, loading, refresh: fetchLeaderboard };
}

// Hook for getting a single judge's stats
export function useJudgeStats(userId: string | undefined) {
  const [stats, setStats] = useState<{
    judge_xp: number;
    judge_review_count: number;
    judge_level: number;
    weeklyReviews: number;
    pendingReviews: number;
    avgScore: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Get profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('judge_xp, judge_review_count')
        .eq('id', userId)
        .single();

      // Get pending reviews
      const { count: pendingCount } = await supabase
        .from('review_requests')
        .select('*', { count: 'exact', head: true })
        .eq('judge_id', userId)
        .eq('status', 'pending');

      // Get weekly reviews
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { count: weeklyCount } = await supabase
        .from('review_requests')
        .select('*', { count: 'exact', head: true })
        .eq('judge_id', userId)
        .eq('status', 'reviewed')
        .gte('reviewed_at', oneWeekAgo.toISOString());

      // Get avg score
      const { data: reviews } = await supabase
        .from('review_requests')
        .select('total_score')
        .eq('judge_id', userId)
        .eq('status', 'reviewed')
        .not('total_score', 'is', null);

      const avgScore = reviews?.length 
        ? reviews.reduce((sum, r) => sum + (r.total_score || 0), 0) / reviews.length 
        : 0;

      setStats({
        judge_xp: profile?.judge_xp || 0,
        judge_review_count: profile?.judge_review_count || 0,
        judge_level: calculateJudgeLevel(profile?.judge_xp || 0),
        weeklyReviews: weeklyCount || 0,
        pendingReviews: pendingCount || 0,
        avgScore,
      });
    } catch (error) {
      console.error('Error fetching judge stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, refresh: fetchStats };
}
