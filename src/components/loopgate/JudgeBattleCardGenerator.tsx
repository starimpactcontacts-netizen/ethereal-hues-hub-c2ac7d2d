import { useEffect, useState, useCallback } from 'react';
import { Crown, Loader2, Swords, Sparkles, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import BattleWinnerCard, { BattleWinnerCardProps } from './BattleWinnerCard';

type BattleSrc = 'battle' | 'cash_battle' | 'quick_fight';

interface FinishedBattle {
  id: string;
  source: BattleSrc;
  routePrefix: string;
  label: string;
  prize_label?: string | null;
  winner_username: string;
  winner_avatar_url: string | null;
  winner_votes?: number | null;
  loser_username: string;
  loser_avatar_url: string | null;
  loser_votes?: number | null;
  finished_at: string;
}

export default function JudgeBattleCardGenerator() {
  const { user, profile } = useAuth();
  const [battles, setBattles] = useState<FinishedBattle[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<BattleWinnerCardProps | null>(null);

  const fetchBattles = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    const sb: any = supabase;
    const [b, c, q] = await Promise.all([
      sb.from('battles')
        .select('id, challenger_id, opponent_id, challenger_username, opponent_username, challenger_avatar_url, opponent_avatar_url, challenger_votes, opponent_votes, winner_id, judged_at, status')
        .eq('judge_id', user.id)
        .not('winner_id', 'is', null)
        .order('judged_at', { ascending: false })
        .limit(20),
      sb.from('cash_battles')
        .select('id, challenger_id, opponent_id, challenger_username, opponent_username, challenger_avatar_url, opponent_avatar_url, challenger_votes, opponent_votes, winner_id, judged_at, prize_cents, status')
        .eq('judge_id', user.id)
        .not('winner_id', 'is', null)
        .order('judged_at', { ascending: false })
        .limit(20),
      sb.from('quick_fights')
        .select('id, player_1_id, player_2_id, player_1_username, player_2_username, player_1_avatar_url, player_2_avatar_url, player_1_votes, player_2_votes, winner_id, judged_at, status')
        .eq('judge_id', user.id)
        .not('winner_id', 'is', null)
        .order('judged_at', { ascending: false })
        .limit(20),
    ]);

    const merged: FinishedBattle[] = [];

    (b.data ?? []).forEach((row: any) => {
      const winnerIsChallenger = row.winner_id === row.challenger_id;
      merged.push({
        id: row.id,
        source: 'battle',
        routePrefix: 'battle',
        label: '1V1 BATTLE',
        winner_username: winnerIsChallenger ? row.challenger_username : row.opponent_username,
        winner_avatar_url: winnerIsChallenger ? row.challenger_avatar_url : row.opponent_avatar_url,
        winner_votes: winnerIsChallenger ? row.challenger_votes : row.opponent_votes,
        loser_username: winnerIsChallenger ? row.opponent_username : row.challenger_username,
        loser_avatar_url: winnerIsChallenger ? row.opponent_avatar_url : row.challenger_avatar_url,
        loser_votes: winnerIsChallenger ? row.opponent_votes : row.challenger_votes,
        finished_at: row.judged_at || new Date().toISOString(),
      });
    });

    (c.data ?? []).forEach((row: any) => {
      const winnerIsChallenger = row.winner_id === row.challenger_id;
      merged.push({
        id: row.id,
        source: 'cash_battle',
        routePrefix: 'cash-battle',
        label: 'CASH BATTLE',
        prize_label: row.prize_cents ? `$${(row.prize_cents / 100).toFixed(0)} CASH BATTLE` : null,
        winner_username: winnerIsChallenger ? row.challenger_username : row.opponent_username,
        winner_avatar_url: winnerIsChallenger ? row.challenger_avatar_url : row.opponent_avatar_url,
        winner_votes: winnerIsChallenger ? row.challenger_votes : row.opponent_votes,
        loser_username: winnerIsChallenger ? row.opponent_username : row.challenger_username,
        loser_avatar_url: winnerIsChallenger ? row.opponent_avatar_url : row.challenger_avatar_url,
        loser_votes: winnerIsChallenger ? row.opponent_votes : row.challenger_votes,
        finished_at: row.judged_at || new Date().toISOString(),
      });
    });

    (q.data ?? []).forEach((row: any) => {
      const winnerIsP1 = row.winner_id === row.player_1_id;
      merged.push({
        id: row.id,
        source: 'quick_fight',
        routePrefix: 'fight',
        label: 'QUICK FIGHT',
        winner_username: winnerIsP1 ? row.player_1_username : row.player_2_username,
        winner_avatar_url: winnerIsP1 ? row.player_1_avatar_url : row.player_2_avatar_url,
        winner_votes: winnerIsP1 ? row.player_1_votes : row.player_2_votes,
        loser_username: winnerIsP1 ? row.player_2_username : row.player_1_username,
        loser_avatar_url: winnerIsP1 ? row.player_2_avatar_url : row.player_1_avatar_url,
        loser_votes: winnerIsP1 ? row.player_2_votes : row.player_1_votes,
        finished_at: row.judged_at || new Date().toISOString(),
      });
    });

    merged.sort((a, b) => new Date(b.finished_at).getTime() - new Date(a.finished_at).getTime());
    setBattles(merged.slice(0, 30));
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchBattles(); }, [fetchBattles]);

  const open = (battle: FinishedBattle) => {
    setActive({
      isOpen: true,
      onClose: () => setActive(null),
      battleId: battle.id,
      battleLabel: battle.label,
      winnerUsername: battle.winner_username,
      winnerAvatarUrl: battle.winner_avatar_url,
      winnerVotes: battle.winner_votes,
      loserUsername: battle.loser_username,
      loserAvatarUrl: battle.loser_avatar_url,
      loserVotes: battle.loser_votes,
      judgeUsername: profile?.username || null,
      prizeLabel: battle.prize_label,
      routePrefix: battle.routePrefix,
    });
  };

  return (
    <div className="bg-zinc-950 border border-amber-500/30 rounded-xl p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-bold text-white uppercase tracking-wider">1v1 Winner Card</span>
        </div>
        <button onClick={fetchBattles} className="p-1 hover:bg-white/5 rounded">
          <RefreshCw className="w-3 h-3 text-zinc-500" />
        </button>
      </div>
      <p className="text-[10px] text-zinc-500 leading-relaxed">
        Generate a shareable winner card for any battle you've judged. Pick a recent verdict below.
      </p>

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 text-zinc-600 animate-spin" /></div>
      ) : battles.length === 0 ? (
        <div className="text-center py-4 bg-black/40 rounded-lg border border-zinc-800">
          <Swords className="w-5 h-5 text-zinc-700 mx-auto mb-1.5" />
          <p className="text-[10px] text-zinc-500">No judged 1v1s yet</p>
          <p className="text-[9px] text-zinc-600 mt-0.5">Vote on battles above — they'll appear here.</p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[260px] overflow-y-auto -mx-1 px-1">
          {battles.map((b, i) => (
            <motion.button
              key={`${b.source}-${b.id}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.2) }}
              onClick={() => open(b)}
              className="w-full flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/40 p-2 rounded-lg transition-all text-left"
            >
              <Avatar className="w-7 h-7 border border-amber-500/60 shrink-0">
                <AvatarImage src={b.winner_avatar_url || ''} />
                <AvatarFallback className="bg-amber-500/20 text-amber-400 text-[9px] font-bold">
                  {b.winner_username?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <Crown className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                  <span className="text-[11px] font-bold text-white truncate">@{b.winner_username}</span>
                  <span className="text-[9px] text-zinc-600">vs</span>
                  <span className="text-[10px] text-zinc-500 truncate">@{b.loser_username}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[8px] font-bold text-amber-400 tracking-wider">{b.label}</span>
                  <span className="text-[8px] text-zinc-600">·</span>
                  <span className="text-[8px] text-zinc-600">{formatDistanceToNow(new Date(b.finished_at), { addSuffix: true })}</span>
                </div>
              </div>
              <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider shrink-0">Card →</span>
            </motion.button>
          ))}
        </div>
      )}

      {active && <BattleWinnerCard {...active} />}
    </div>
  );
}