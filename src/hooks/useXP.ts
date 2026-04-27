import { useCallback, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// XP thresholds for each level (1-100). Long-grind curve: ~1.26M XP for max level.
// Formula: round(50 * level^2.2). Stay in sync with public.calculate_level_from_xp().
export const MAX_LEVEL = 100;
export const XP_LEVELS = [
  { level: 1, xpRequired: 0 }, { level: 2, xpRequired: 230 }, { level: 3, xpRequired: 561 }, { level: 4, xpRequired: 1056 }, { level: 5, xpRequired: 1725 }, { level: 6, xpRequired: 2576 }, { level: 7, xpRequired: 3616 }, { level: 8, xpRequired: 4850 }, { level: 9, xpRequired: 6285 }, { level: 10, xpRequired: 7924 },
  { level: 11, xpRequired: 9773 }, { level: 12, xpRequired: 11835 }, { level: 13, xpRequired: 14114 }, { level: 14, xpRequired: 16613 }, { level: 15, xpRequired: 19336 }, { level: 16, xpRequired: 22286 }, { level: 17, xpRequired: 25466 }, { level: 18, xpRequired: 28878 }, { level: 19, xpRequired: 32526 }, { level: 20, xpRequired: 36411 },
  { level: 21, xpRequired: 40537 }, { level: 22, xpRequired: 44906 }, { level: 23, xpRequired: 49519 }, { level: 24, xpRequired: 54379 }, { level: 25, xpRequired: 59489 }, { level: 26, xpRequired: 64850 }, { level: 27, xpRequired: 70464 }, { level: 28, xpRequired: 76334 }, { level: 29, xpRequired: 82460 }, { level: 30, xpRequired: 88846 },
  { level: 31, xpRequired: 95492 }, { level: 32, xpRequired: 102400 }, { level: 33, xpRequired: 109572 }, { level: 34, xpRequired: 117010 }, { level: 35, xpRequired: 124715 }, { level: 36, xpRequired: 132689 }, { level: 37, xpRequired: 140933 }, { level: 38, xpRequired: 149449 }, { level: 39, xpRequired: 158238 }, { level: 40, xpRequired: 167302 },
  { level: 41, xpRequired: 176642 }, { level: 42, xpRequired: 186260 }, { level: 43, xpRequired: 196156 }, { level: 44, xpRequired: 206332 }, { level: 45, xpRequired: 216789 }, { level: 46, xpRequired: 227529 }, { level: 47, xpRequired: 238553 }, { level: 48, xpRequired: 249862 }, { level: 49, xpRequired: 261458 }, { level: 50, xpRequired: 273341 },
  { level: 51, xpRequired: 285512 }, { level: 52, xpRequired: 297973 }, { level: 53, xpRequired: 310726 }, { level: 54, xpRequired: 323770 }, { level: 55, xpRequired: 337107 }, { level: 56, xpRequired: 350739 }, { level: 57, xpRequired: 364666 }, { level: 58, xpRequired: 378889 }, { level: 59, xpRequired: 393409 }, { level: 60, xpRequired: 408228 },
  { level: 61, xpRequired: 423346 }, { level: 62, xpRequired: 438765 }, { level: 63, xpRequired: 454485 }, { level: 64, xpRequired: 470507 }, { level: 65, xpRequired: 486832 }, { level: 66, xpRequired: 503462 }, { level: 67, xpRequired: 520397 }, { level: 68, xpRequired: 537638 }, { level: 69, xpRequired: 555185 }, { level: 70, xpRequired: 573041 },
  { level: 71, xpRequired: 591205 }, { level: 72, xpRequired: 609679 }, { level: 73, xpRequired: 628464 }, { level: 74, xpRequired: 647560 }, { level: 75, xpRequired: 666968 }, { level: 76, xpRequired: 686689 }, { level: 77, xpRequired: 706724 }, { level: 78, xpRequired: 727073 }, { level: 79, xpRequired: 747738 }, { level: 80, xpRequired: 768720 },
  { level: 81, xpRequired: 790018 }, { level: 82, xpRequired: 811634 }, { level: 83, xpRequired: 833569 }, { level: 84, xpRequired: 855824 }, { level: 85, xpRequired: 878399 }, { level: 86, xpRequired: 901294 }, { level: 87, xpRequired: 924512 }, { level: 88, xpRequired: 948051 }, { level: 89, xpRequired: 971914 }, { level: 90, xpRequired: 996101 },
  { level: 91, xpRequired: 1020613 }, { level: 92, xpRequired: 1045450 }, { level: 93, xpRequired: 1070613 }, { level: 94, xpRequired: 1096103 }, { level: 95, xpRequired: 1121920 }, { level: 96, xpRequired: 1148066 }, { level: 97, xpRequired: 1174540 }, { level: 98, xpRequired: 1201344 }, { level: 99, xpRequired: 1228478 }, { level: 100, xpRequired: 1255943 },
];

// XP amounts for various actions — 10x scaled for fast addictive leveling
export const XP_REWARDS = {
  // Daily Actions
  app_open: 50,
  check_rankings: 30,
  check_arenas: 30,
  view_crew: 20,
  update_profile: 100,

  // Competitive Actions
  enter_event: 200,
  submit_edit: 500,
  receive_review: 100,
  dnf: 50,

  // Skill Actions
  top_10: 750,
  top_3: 1500,
  event_win: 3000,
  enter_top_50: 1500,
  enter_top_10: 3000,
  rank_1: 5000,

  // Social Actions
  join_crew: 150,
  create_crew: 300,
  crew_chat: 100,
  arena_chat: 10,
  verify_platform: 250,

  // Daily caps (set high to effectively uncap)
  crew_chat_cap: 100000,
  arena_chat_cap: 10000,
};

// Action descriptions for toasts
const ACTION_DESCRIPTIONS: Record<string, string> = {
  app_open: 'opening the app',
  check_rankings: 'checking rankings',
  check_arenas: 'visiting arenas',
  view_crew: 'viewing unit page',
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
  join_crew: 'joining a unit',
  create_crew: 'creating a unit',
  crew_chat: 'unit chat',
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
  if (currentLevel >= MAX_LEVEL) return XP_LEVELS[MAX_LEVEL - 1].xpRequired;
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
