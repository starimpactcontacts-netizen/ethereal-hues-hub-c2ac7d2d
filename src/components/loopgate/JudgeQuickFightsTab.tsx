import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, Gavel, Search, Trophy, Clock, ExternalLink } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePendingJudgeFights, useRecentQuickFights } from '@/hooks/useQuickFight';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

export default function JudgeQuickFightsTab() {
  const navigate = useNavigate();
  const { fights: pendingFights, loading: pendingLoading } = usePendingJudgeFights();
  const { fights: recentFights, loading: recentLoading } = useRecentQuickFights(30);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPending = pendingFights.filter(f => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return f.player_1_username.toLowerCase().includes(q) || (f.player_2_username || '').toLowerCase().includes(q);
  });

  const filteredRecent = recentFights.filter(f => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return f.player_1_username.toLowerCase().includes(q) || (f.player_2_username || '').toLowerCase().includes(q);
  });

  return (
    <div className="px-3 py-3 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search fighters..."
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-500/50"
        />
      </div>

      {/* Pending — needs judging */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Gavel className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Needs Your Verdict</span>
          </div>
          {filteredPending.length > 0 && (
            <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-bold">
              {filteredPending.length}
            </span>
          )}
        </div>

        {pendingLoading ? (
          <div className="flex justify-center py-6">
            <Swords className="w-6 h-6 text-zinc-600 animate-pulse" />
          </div>
        ) : filteredPending.length === 0 ? (
          <div className="text-center py-6 bg-zinc-900/50 rounded-lg border border-zinc-800">
            <Gavel className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
            <p className="text-xs text-zinc-500">No fights awaiting judgment</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">Quick 1v1s will appear here when both edits are submitted</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPending.map((fight, i) => (
              <motion.button
                key={fight.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => navigate(`/fight/${fight.id}`)}
                className="w-full bg-zinc-900 border border-purple-500/30 hover:border-purple-500/60 p-3 rounded-lg transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  {/* P1 */}
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <Avatar className="w-8 h-8 border-2 border-red-500/60">
                      <AvatarImage src={fight.player_1_avatar_url || ''} />
                      <AvatarFallback className="bg-red-500/20 text-red-400 text-[10px] font-bold">
                        {fight.player_1_username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[11px] font-medium text-white truncate">{fight.player_1_username}</span>
                  </div>

                  <Swords className="w-4 h-4 text-purple-400 shrink-0" />

                  {/* P2 */}
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                    <span className="text-[11px] font-medium text-white truncate">{fight.player_2_username}</span>
                    <Avatar className="w-8 h-8 border-2 border-blue-500/60">
                      <AvatarImage src={fight.player_2_avatar_url || ''} />
                      <AvatarFallback className="bg-blue-500/20 text-blue-400 text-[10px] font-bold">
                        {fight.player_2_username?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-gold font-bold">+20 IDX</span>
                    <span className="text-[9px] text-zinc-500">{fight.duration_minutes}min</span>
                  </div>
                  <span className="text-[9px] text-purple-400 font-bold uppercase tracking-wider">TAP TO JUDGE →</span>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Recent / Browse */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Recent Quick 1v1s</span>
        </div>

        {recentLoading ? (
          <div className="flex justify-center py-6">
            <Swords className="w-6 h-6 text-zinc-600 animate-pulse" />
          </div>
        ) : filteredRecent.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-4">No quick fights yet</p>
        ) : (
          <div className="space-y-1.5">
            {filteredRecent.map((fight) => (
              <button
                key={fight.id}
                onClick={() => navigate(`/fight/${fight.id}`)}
                className="w-full flex items-center gap-3 p-2.5 bg-zinc-900/50 hover:bg-zinc-800/60 rounded-lg transition-colors text-left"
              >
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <Avatar className="w-6 h-6 border border-red-500/40">
                    <AvatarImage src={fight.player_1_avatar_url || ''} />
                    <AvatarFallback className="bg-red-500/10 text-red-400 text-[8px]">{fight.player_1_username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-[10px] text-white truncate">{fight.player_1_username}</span>
                </div>

                <span className="text-[9px] text-zinc-500">vs</span>

                <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                  <span className="text-[10px] text-white truncate">{fight.player_2_username || '???'}</span>
                  <Avatar className="w-6 h-6 border border-blue-500/40">
                    <AvatarImage src={fight.player_2_avatar_url || ''} />
                    <AvatarFallback className="bg-blue-500/10 text-blue-400 text-[8px]">{(fight.player_2_username || '?')[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                </div>

                <div className="shrink-0 text-right">
                  {fight.status === 'completed' && fight.winner_score != null ? (
                    <div className="flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-gold" />
                      <span className="text-[9px] text-gold font-bold">{fight.winner_score}-{fight.loser_score}</span>
                    </div>
                  ) : fight.status === 'active' ? (
                    <span className="text-[9px] text-red-400 font-bold animate-pulse">LIVE</span>
                  ) : fight.status === 'judging' ? (
                    <span className="text-[9px] text-purple-400 font-bold">JUDGING</span>
                  ) : (
                    <span className="text-[9px] text-zinc-500">{formatDistanceToNow(new Date(fight.created_at), { addSuffix: true })}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* XP Info */}
      <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-3 text-center">
        <p className="text-[10px] text-zinc-400">
          <span className="text-gold font-bold">+15 JXP</span> per quick 1v1 judged •{' '}
          <span className="text-gold font-bold">+5 JXP</span> bonus for first daily verdict
        </p>
      </div>
    </div>
  );
}
