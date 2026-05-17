import type { QuickFight } from '@/hooks/useQuickFight';
import BattleOutroButton from './BattleOutroButton';
import BattleIntroButton from './BattleIntroButton';

interface QuickFightResultCardProps {
  fight: QuickFight;
}

export default function QuickFightResultCard({ fight }: QuickFightResultCardProps) {
  if (!fight.winner_id || fight.status !== 'completed') return null;

  return (
    <div className="space-y-3 max-w-[360px] mx-auto">
      {/* Battle Intro — VS + trash-talk clip to splice onto the START of the edit */}
      <BattleIntroButton
        player1Username={fight.player_1_username || 'red'}
        player2Username={fight.player_2_username || 'blue'}
        player1Id={fight.player_1_id}
        player2Id={fight.player_2_id || ''}
        player1Avatar={fight.player_1_avatar_url}
        player2Avatar={fight.player_2_avatar_url}
        fightId={fight.id}
      />

      {/* Battle Outro — "Vote for me" promo clip to splice onto the END */}
      <BattleOutroButton
        player1Username={fight.player_1_username || 'red'}
        player2Username={fight.player_2_username || 'blue'}
        fightId={fight.id}
      />
    </div>
  );
}
