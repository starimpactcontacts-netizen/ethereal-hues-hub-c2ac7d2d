import { supabase } from '@/integrations/supabase/client';

export async function claimBattle(battleId: string, judgeId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('battles')
      .update({
        judge_id: judgeId,
        judge_claimed_at: new Date().toISOString(),
      })
      .eq('id', battleId)
      .eq('status', 'judging')
      .is('judge_id', null);

    return !error;
  } catch (error) {
    console.error('Error claiming battle:', error);
    return false;
  }
}

export async function judgeBattle(
  battleId: string,
  judgeId: string,
  challengerScore: number,
  opponentScore: number,
  winnerId: string,
  judgeNotes: string | null
): Promise<boolean> {
  try {
    const { data: battle } = await supabase
      .from('battles')
      .select('winner_index_awarded, loser_index_penalty, challenger_id, opponent_id')
      .eq('id', battleId)
      .single();

    if (!battle) return false;

    const loserId = winnerId === battle.challenger_id ? battle.opponent_id : battle.challenger_id;

    const { error } = await supabase
      .from('battles')
      .update({
        challenger_score: challengerScore,
        opponent_score: opponentScore,
        winner_id: winnerId,
        judge_notes: judgeNotes,
        judged_at: new Date().toISOString(),
        status: 'completed',
      })
      .eq('id', battleId)
      .eq('judge_id', judgeId);

    if (error) throw error;

    // Award index points to winner
    try {
      const { data: winnerProfile } = await supabase
        .from('profiles')
        .select('global_index_score')
        .eq('id', winnerId)
        .single();

      if (winnerProfile) {
        await supabase
          .from('profiles')
          .update({ global_index_score: (winnerProfile.global_index_score || 0) + (battle.winner_index_awarded || 20) })
          .eq('id', winnerId);
      }
    } catch (e) {
      console.error('Error awarding winner index:', e);
    }

    // Penalize loser
    if (loserId) {
      try {
        const { data: loserProfile } = await supabase
          .from('profiles')
          .select('global_index_score')
          .eq('id', loserId)
          .single();

        if (loserProfile) {
          await supabase
            .from('profiles')
            .update({ global_index_score: Math.max(0, (loserProfile.global_index_score || 0) - (battle.loser_index_penalty || 5)) })
            .eq('id', loserId);
        }
      } catch (e) {
        console.error('Error applying loser penalty:', e);
      }
    }

    // Create notifications
    try {
      const notifications: any[] = [
        {
          user_id: winnerId,
          type: 'battle_won',
          title: 'Battle Won! 🏆',
          message: `You won the 1v1 battle! +${battle.winner_index_awarded || 20} Index`,
          data: { battle_id: battleId },
        },
      ];
      if (loserId) {
        notifications.push({
          user_id: loserId,
          type: 'battle_lost',
          title: 'Battle Result',
          message: `You lost the 1v1 battle. -${battle.loser_index_penalty || 5} Index`,
          data: { battle_id: battleId },
        });
      }
      await supabase.from('notifications').insert(notifications);
    } catch (e) {
      console.error('Error creating notifications:', e);
    }

    return true;
  } catch (error) {
    console.error('Error judging battle:', error);
    return false;
  }
}
