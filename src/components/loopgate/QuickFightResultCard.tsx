import type { QuickFight } from '@/hooks/useQuickFight';
import BattleOutroButton from './BattleOutroButton';

interface QuickFightResultCardProps {
  fight: QuickFight;
}

export default function QuickFightResultCard({ fight }: QuickFightResultCardProps) {
  if (!fight.winner_id || fight.status !== 'completed') return null;

  return (
    <div className="space-y-3 max-w-[360px] mx-auto">
      {/* Battle Outro — 3s promo clip editors can splice onto their post */}
      <BattleOutroButton
        player1Username={fight.player_1_username || 'red'}
        player2Username={fight.player_2_username || 'blue'}
        fightId={fight.id}
      />
    </div>
  );
}
