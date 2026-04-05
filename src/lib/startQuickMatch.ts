import { acceptBattle } from '@/hooks/useBattles';
import { findQuickFight } from '@/hooks/useQuickFight';
import { supabase } from '@/integrations/supabase/client';

interface StartQuickMatchParams {
  avatarUrl: string | null;
  userId: string;
  username: string;
}

export type QuickStartResult =
  | { id: string; type: 'battle' }
  | { id: string; type: 'fight' }
  | { type: 'queue' };

export async function startQuickMatch({
  avatarUrl,
  userId,
  username,
}: StartQuickMatchParams): Promise<QuickStartResult> {
  const { data: openBattles, error } = await supabase
    .from('battles')
    .select('id, challenger_username')
    .eq('status', 'pending')
    .eq('challenge_type', 'open')
    .is('opponent_id', null)
    .neq('challenger_id', userId)
    .order('created_at', { ascending: true })
    .limit(5);

  if (error) {
    console.error('Open battle lookup failed:', error);
  }

  for (const battle of openBattles ?? []) {
    const accepted = await acceptBattle(battle.id, userId, username, avatarUrl);

    if (accepted) {
      return { id: battle.id, type: 'battle' };
    }
  }

  const fightId = await findQuickFight(userId, username, avatarUrl);

  if (fightId) {
    return { id: fightId, type: 'fight' };
  }

  return { type: 'queue' };
}