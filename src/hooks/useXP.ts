import { useCallback, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// XP thresholds for each level
export const XP_LEVELS = [
  { level: 1, xpRequired: 0 },
  { level: 2, xpRequired: 100 },
  { level: 3, xpRequired: 300 },
  { level: 4, xpRequired: 600 },
  { level: 5, xpRequired: 1000 },
  { level: 6, xpRequired: 1500 },
  { level: 7, xpRequired: 2200 },
  { level: 8, xpRequired: 3200 },
  { level: 9, xpRequired: 4500 },
  { level: 10, xpRequired: 7000 },
];

// XP amounts for various actions
export const XP_REWARDS = {
  // Daily Actions
  app_open: 5,
  check_rankings: 3,
  check_arenas: 3,
  view_crew: 2,
  update_profile: 10,
  
  // Competitive Actions
  enter_event: 20,
  submit_edit: 50,
  receive_review: 10,
  dnf: 5,
  
  // Skill Actions
  top_10: 75,
  top_3: 150,
  event_win: 300,
  enter_top_50: 150,
  enter_top_10: 300,
  rank_1: 500,
  
  // Social Actions
  join_crew: 15,
  create_crew: 30,
  crew_chat: 10,
  arena_chat: 1,
  verify_platform: 25,
  
  // Daily caps (set high to effectively uncap)
  crew_chat_cap: 10000,
  arena_chat_cap: 1000,
};

// Action descriptions for toasts
const ACTION_DESCRIPTIONS: Record<string, string> = {
  app_open: 'opening the app',
  check_rankings: 'checking rankings',
  check_arenas: 'visiting arenas',
  view_crew: 'viewing crew page',
  update_profile: 'updating your profile',
  enter_event: 'joining an event',
  submit_edit: 'submitting an edit',
  receive_review: 'receiving a judge review',
  dnf: 'participating in an event',
  top_10: 'finishing in the Top 10',
  top_3: 'finishing in the Top 3',
  event_win: 'winning an event',
  enter_top_50: 'entering the Global Top 50',
  enter_top_10: 'entering the Global Top 10',
  rank_1: 'reaching Rank #1',
  join_crew: 'joining a crew',
  create_crew: 'creating a crew',
  crew_chat: 'crew chat',
  arena_chat: 'arena chat',
  verify_platform: 'verifying a platform',
  login_streak: 'daily login streak',
  sanctioned_tournament: 'competing in a sanctioned tournament',
  judge_review: 'completing a judge review',
};

export interface XPHistoryEntry {
  id: string;
  xp_amount: number;
  action: string;
  description: string | null;
  created_at: string;
}

export interface LoginStreak {
  current_streak: number;
  longest_streak: number;
  last_login_date: string | null;
}

export function calculateLevelFromXP(xp: number): number {
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i].xpRequired) {
      return XP_LEVELS[i].level;
    }
  }
  return 1;
}

export function getXPForNextLevel(currentLevel: number): number {
  if (currentLevel >= 10) return XP_LEVELS[9].xpRequired;
  return XP_LEVELS[currentLevel].xpRequired;
}

export function getXPForCurrentLevel(currentLevel: number): number {
  return XP_LEVELS[currentLevel - 1]?.xpRequired || 0;
}

export function useXP() {
  const { user } = useAuth();
  const [xp, setXP] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState<LoginStreak | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch current XP and level
  const fetchXP = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('xp, level')
      .eq('id', user.id)
      .single();

    if (profile) {
      setXP(profile.xp || 0);
      setLevel(profile.level || 1);
    }
    setLoading(false);
  }, [user]);

  // Fetch login streak
  const fetchStreak = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from('login_streaks')
      .select('current_streak, longest_streak, last_login_date')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setStreak(data as LoginStreak);
    }
  }, [user]);

  useEffect(() => {
    fetchXP();
    fetchStreak();
  }, [fetchXP, fetchStreak]);

  // Award XP with toast notification
  const awardXP = useCallback(async (
    amount: number,
    action: string,
    description?: string
  ): Promise<{ success: boolean; leveledUp: boolean; newLevel?: number }> => {
    if (!user) return { success: false, leveledUp: false };

    const { data, error } = await supabase.rpc('award_xp', {
      p_user_id: user.id,
      p_amount: amount,
      p_action: action,
      p_description: description || null,
    });

    if (error) {
      console.error('Error awarding XP:', error);
      return { success: false, leveledUp: false };
    }

    const result = data?.[0];
    if (result) {
      setXP(result.new_xp);
      setLevel(result.new_level);

      // Show toast
      const actionDesc = ACTION_DESCRIPTIONS[action] || action;
      toast.success(`+${amount} XP`, {
        description: `Earned for ${actionDesc}`,
        duration: 3000,
      });

      if (result.leveled_up) {
        setTimeout(() => {
          toast.success(`🎉 Level Up!`, {
            description: `You reached Level ${result.new_level}. Keep grinding!`,
            duration: 5000,
          });
        }, 500);
      }

      return { success: true, leveledUp: result.leveled_up, newLevel: result.new_level };
    }

    return { success: false, leveledUp: false };
  }, [user]);

  // Award daily-capped XP (for chat messages)
  const awardCappedXP = useCallback(async (
    amount: number,
    actionType: 'crew_chat' | 'arena_chat',
    description?: string
  ): Promise<{ success: boolean; xpAwarded: number }> => {
    if (!user) return { success: false, xpAwarded: 0 };

    const cap = actionType === 'crew_chat' ? XP_REWARDS.crew_chat_cap : XP_REWARDS.arena_chat_cap;

    const { data, error } = await supabase.rpc('award_daily_capped_xp', {
      p_user_id: user.id,
      p_amount: amount,
      p_action_type: actionType,
      p_daily_cap: cap,
      p_description: description || null,
    });

    if (error) {
      console.error('Error awarding capped XP:', error);
      return { success: false, xpAwarded: 0 };
    }

    const result = data?.[0];
    if (result && result.xp_awarded > 0) {
      setXP(result.new_xp);
      setLevel(result.new_level);

      // Don't spam toast for every chat message - only if leveled up
      if (result.leveled_up) {
        toast.success(`🎉 Level Up!`, {
          description: `You reached Level ${result.new_level}. Keep grinding!`,
          duration: 5000,
        });
      }

      return { success: true, xpAwarded: result.xp_awarded };
    }

    return { success: false, xpAwarded: 0 };
  }, [user]);

  // Process login streak (call once per session)
  const processLoginStreak = useCallback(async (): Promise<{ xpEarned: number; streak: number }> => {
    if (!user) return { xpEarned: 0, streak: 0 };

    const { data, error } = await supabase.rpc('process_login_streak', {
      p_user_id: user.id,
    });

    if (error) {
      console.error('Error processing login streak:', error);
      return { xpEarned: 0, streak: 0 };
    }

    const result = data?.[0];
    if (result) {
      setXP(result.new_xp);
      setLevel(result.new_level);
      setStreak({
        current_streak: result.current_streak,
        longest_streak: 0, // We'll fetch this separately if needed
        last_login_date: new Date().toISOString(),
      });

      if (result.streak_xp > 0) {
        toast.success(`+${result.streak_xp} XP`, {
          description: `Day ${result.current_streak} login streak!`,
          duration: 3000,
        });
      }

      if (result.leveled_up) {
        setTimeout(() => {
          toast.success(`🎉 Level Up!`, {
            description: `You reached Level ${result.new_level}. Keep grinding!`,
            duration: 5000,
          });
        }, 500);
      }

      return { xpEarned: result.streak_xp, streak: result.current_streak };
    }

    return { xpEarned: 0, streak: 0 };
  }, [user]);

  return {
    xp,
    level,
    streak,
    loading,
    awardXP,
    awardCappedXP,
    processLoginStreak,
    refetch: fetchXP,
  };
}

// Hook for fetching XP history
export function useXPHistory(limit: number = 10) {
  const { user } = useAuth();
  const [history, setHistory] = useState<XPHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      const { data } = await supabase
        .from('xp_history')
        .select('id, xp_amount, action, description, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      setHistory((data || []) as XPHistoryEntry[]);
      setLoading(false);
    };

    fetchHistory();
  }, [user, limit]);

  return { history, loading };
}
