import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Battle {
  id: string;
  challenger_id: string;
  opponent_id: string | null;
  challenger_username: string;
  opponent_username: string | null;
  challenger_avatar_url: string | null;
  opponent_avatar_url: string | null;
  challenge_type: 'open' | 'direct';
  league_tier: string;
  duration_hours: number;
  status: 'pending' | 'accepted' | 'active' | 'judging' | 'completed' | 'cancelled' | 'forfeited';
  accepted_at: string | null;
  starts_at: string | null;
  ends_at: string | null;
  challenger_submission_url: string | null;
  challenger_submission_platform: string | null;
  challenger_submitted_at: string | null;
  opponent_submission_url: string | null;
  opponent_submission_platform: string | null;
  opponent_submitted_at: string | null;
  judge_id: string | null;
  judge_claimed_at: string | null;
  challenger_score: number | null;
  opponent_score: number | null;
  judge_notes: string | null;
  judged_at: string | null;
  challenger_votes: number;
  opponent_votes: number;
  view_count: number;
  winner_id: string | null;
  winner_index_awarded: number;
  loser_index_penalty: number;
  created_at: string;
  updated_at: string;
}

export function useBattles(statuses?: string[]) {
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchBattles() {
      let query = supabase
        .from('battles')
        .select('*')
        .order('created_at', { ascending: false });

      if (statuses && statuses.length > 0) {
        query = query.in('status', statuses);
      }

      const { data, error } = await query.limit(50);

      if (!error && data) {
        setBattles(data as Battle[]);
      }
      setLoading(false);
    }

    fetchBattles();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('battles_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'battles' },
        () => {
          fetchBattles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statuses?.join(',')]);

  return { battles, loading };
}

export function useBattle(battleId: string | undefined) {
  const [battle, setBattle] = useState<Battle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!battleId) {
      setLoading(false);
      return;
    }

    async function fetchBattle() {
      const { data, error } = await supabase
        .from('battles')
        .select('*')
        .eq('id', battleId)
        .maybeSingle();

      if (!error && data) {
        setBattle(data as Battle);
      }
      setLoading(false);
    }

    fetchBattle();

    // Subscribe to realtime updates for this battle
    const channel = supabase
      .channel(`battle_${battleId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'battles',
          filter: `id=eq.${battleId}`
        },
        (payload) => {
          if (payload.new) {
            setBattle(payload.new as Battle);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [battleId]);

  return { battle, loading };
}

export function useMyBattles() {
  const { user } = useAuth();
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    async function fetchMyBattles() {
      const { data, error } = await supabase
        .from('battles')
        .select('*')
        .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setBattles(data as Battle[]);
      }
      setLoading(false);
    }

    fetchMyBattles();
  }, [user?.id]);

  return { battles, loading };
}

export async function createBattle(
  challengerId: string,
  challengerUsername: string,
  challengerAvatarUrl: string | null,
  leagueTier: string,
  durationHours: number,
  challengeType: 'open' | 'direct',
  opponentId?: string,
  opponentUsername?: string,
  opponentAvatarUrl?: string | null
): Promise<{ success: boolean; battleId?: string; error?: string }> {
  try {
    const battleData: any = {
      challenger_id: challengerId,
      challenger_username: challengerUsername,
      challenger_avatar_url: challengerAvatarUrl,
      league_tier: leagueTier,
      duration_hours: durationHours,
      challenge_type: challengeType,
      status: challengeType === 'direct' ? 'pending' : 'pending',
    };

    if (opponentId && challengeType === 'direct') {
      battleData.opponent_id = opponentId;
      battleData.opponent_username = opponentUsername;
      battleData.opponent_avatar_url = opponentAvatarUrl;
    }

    const { data, error } = await supabase
      .from('battles')
      .insert(battleData)
      .select()
      .single();

    if (error) throw error;

    return { success: true, battleId: data.id };
  } catch (error: any) {
    console.error('Error creating battle:', error);
    return { success: false, error: error.message };
  }
}

export async function acceptBattle(battleId: string, opponentId: string, opponentUsername: string, opponentAvatarUrl: string | null): Promise<boolean> {
  try {
    const startsAt = new Date();
    const { data: battle } = await supabase
      .from('battles')
      .select('duration_hours')
      .eq('id', battleId)
      .single();

    const endsAt = new Date(startsAt.getTime() + (battle?.duration_hours || 48) * 60 * 60 * 1000);

    const { error } = await supabase
      .from('battles')
      .update({
        opponent_id: opponentId,
        opponent_username: opponentUsername,
        opponent_avatar_url: opponentAvatarUrl,
        status: 'active',
        accepted_at: startsAt.toISOString(),
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
      })
      .eq('id', battleId)
      .eq('status', 'pending');

    return !error;
  } catch (error) {
    console.error('Error accepting battle:', error);
    return false;
  }
}

export async function submitToBattle(
  battleId: string,
  userId: string,
  isChallenger: boolean,
  submissionUrl: string,
  platform: string
): Promise<boolean> {
  try {
    const updateData = isChallenger
      ? {
          challenger_submission_url: submissionUrl,
          challenger_submission_platform: platform,
          challenger_submitted_at: new Date().toISOString(),
        }
      : {
          opponent_submission_url: submissionUrl,
          opponent_submission_platform: platform,
          opponent_submitted_at: new Date().toISOString(),
        };

    const { error } = await supabase
      .from('battles')
      .update(updateData)
      .eq('id', battleId);

    if (error) throw error;

    // Check if both have submitted
    const { data: battle } = await supabase
      .from('battles')
      .select('*')
      .eq('id', battleId)
      .single();

    if (battle?.challenger_submitted_at && battle?.opponent_submitted_at) {
      // Both submitted - move to judging
      await supabase
        .from('battles')
        .update({ status: 'judging' })
        .eq('id', battleId);
    }

    return true;
  } catch (error) {
    console.error('Error submitting to battle:', error);
    return false;
  }
}

export async function recordBattleView(battleId: string, viewerId: string | null): Promise<void> {
  try {
    await supabase
      .from('battle_views')
      .insert({
        battle_id: battleId,
        viewer_id: viewerId,
      });
  } catch (error) {
    // Silently fail - view tracking is non-critical
    console.debug('View already recorded or error:', error);
  }
}

export async function voteOnBattle(battleId: string, oderId: string, votedForId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('battle_votes')
      .upsert({
        battle_id: battleId,
        user_id: oderId,
        voted_for: votedForId,
      }, {
        onConflict: 'battle_id,user_id'
      });

    return !error;
  } catch (error) {
    console.error('Error voting:', error);
    return false;
  }
}

export async function getMyVote(battleId: string, oderId: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('battle_votes')
      .select('voted_for')
      .eq('battle_id', battleId)
      .eq('user_id', oderId)
      .maybeSingle();

    return data?.voted_for || null;
  } catch (error) {
    return null;
  }
}
