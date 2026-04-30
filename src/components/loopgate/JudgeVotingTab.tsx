import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Gavel, Swords, DollarSign, Zap, Trophy, Vote } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useJudgeVotingQueue, type BattleSource } from '@/hooks/useJudgeVotingQueue';

const SOURCE_META: Record<BattleSource, { label: string; icon: typeof Swords; tone: string; ring: string }> = {
  battle:       { label: '1V1 BATTLE',  icon: Swords,     tone: 'text-blue-400',    ring: 'border-blue-500/40' },
  cash_battle:  { label: 'CASH BATTLE', icon: DollarSign, tone: 'text-emerald-400', ring: 'border-emerald-500/40' },
  quick_fight:  { label: 'QUICK 1V1',   icon: Zap,        tone: 'text-red-400',     ring: 'border-red-500/40' },
  competition:  { label: 'COMPETITION', icon: Trophy,     tone: 'text-amber-400',   ring: 'border-amber-500/40' },
};

const FILTERS: { id: 'all' | BattleSource; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'quick_fight', label: 'Quick' },
  { id: 'battle', label: '1v1' },
  { id: 'cash_battle', label: 'Cash' },
  { id: 'competition', label: 'Comp' },
];

export default function JudgeVotingTab() {
  const navigate = useNavigate();
  const { items, loading } = useJudgeVotingQueue();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | BattleSource>('all');

  const filtered = items.filter(item => {
    if (filter !== 'all' && item.source !== filter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.player_1_username?.toLowerCase().includes(q) ||
      (item.player_2_username || '').toLowerCase().includes(q)
    );
  });

  const counts = items.reduce((acc, i) => {
    acc[i.source] = (acc[i.source] || 0) + 1;
    return acc;
  }, {} as Record<BattleSource, number>);

  return (
    <div className="px-3 py-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Vote className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Judge Voting</span>
        </div>
        {filtered.length > 0 && (
          <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-bold">
            {filtered.length} waiting
          </span>
        )}
      </div>

      <p className="text-[10px] text-zinc-500 leading-relaxed">
        All edit battles in one queue. Tap a match to watch both edits and lock in your vote.
      </p>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search editors..."
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTERS.map(f => {
          const active = filter === f.id;
          const count = f.id === 'all' ? items.length : (counts[f.id as BattleSource] || 0);
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                active
                  ? 'bg-white text-black border-white'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500'
              }`}
            >
              {f.label}
              {count > 0 && <span className={`ml-1 ${active ? 'text-black/60' : 'text-zinc-600'}`}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Gavel className="w-6 h-6 text-zinc-600 animate-pulse" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 bg-zinc-900/50 rounded-lg border border-zinc-800">
          <Gavel className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
          <p className="text-xs text-zinc-500">No battles waiting on a vote</p>
          <p className="text-[10px] text-zinc-600 mt-0.5">New matches drop in here the moment both edits are locked in.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item, i) => {
            const meta = SOURCE_META[item.source];
            const Icon = meta.icon;
            return (
              <motion.button
                key={`${item.source}-${item.id}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                onClick={() => navigate(item.route)}
                className={`w-full bg-zinc-900 border ${meta.ring} hover:border-white/40 p-3 rounded-lg transition-all text-left`}
              >
                {/* Top row: source pill + age */}
                <div className="flex items-center justify-between mb-2">
                  <div className={`inline-flex items-center gap-1 ${meta.tone}`}>
                    <Icon className="w-3 h-3" />
                    <span className="text-[9px] font-bold tracking-wider">{meta.label}</span>
                  </div>
                  <span className="text-[9px] text-zinc-600">
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </span>
                </div>

                {/* Players */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <Avatar className="w-8 h-8 border-2 border-red-500/60">
                      <AvatarImage src={item.player_1_avatar_url || ''} />
                      <AvatarFallback className="bg-red-500/20 text-red-400 text-[10px] font-bold">
                        {item.player_1_username?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[11px] font-medium text-white truncate">{item.player_1_username || '—'}</span>
                  </div>

                  {item.player_2_username ? (
                    <>
                      <Swords className={`w-4 h-4 shrink-0 ${meta.tone}`} />
                      <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                        <span className="text-[11px] font-medium text-white truncate">{item.player_2_username}</span>
                        <Avatar className="w-8 h-8 border-2 border-blue-500/60">
                          <AvatarImage src={item.player_2_avatar_url || ''} />
                          <AvatarFallback className="bg-blue-500/20 text-blue-400 text-[10px] font-bold">
                            {item.player_2_username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </>
                  ) : (
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Group vote</span>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-zinc-800">
                  {item.prize_label ? (
                    <span className={`text-[9px] font-bold ${meta.tone}`}>{item.prize_label}</span>
                  ) : <span />}
                  <span className="text-[9px] text-purple-400 font-bold uppercase tracking-wider">Tap to vote →</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* XP info */}
      <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-3 text-center">
        <p className="text-[10px] text-zinc-400">
          Every vote earns <span className="text-gold font-bold">+15 JXP</span> •
          Cash battles & competitions pay <span className="text-emerald-400 font-bold">bonus</span>
        </p>
      </div>
    </div>
  );
}
