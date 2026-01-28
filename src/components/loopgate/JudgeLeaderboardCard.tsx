import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Flame, Crown, Medal, ChevronRight, Gavel } from 'lucide-react';
import { useJudgeLeaderboard, JudgeLeaderboardEntry } from '@/hooks/useJudgeLeaderboard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import JudgeLevelBadge from './JudgeLevelBadge';
import VerifiedBadge from './VerifiedBadge';
import { cn } from '@/lib/utils';

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown size={14} className="text-gold" />;
  if (rank === 2) return <Medal size={14} className="text-zinc-400" />;
  if (rank === 3) return <Medal size={14} className="text-amber-700" />;
  return null;
}

function JudgeRow({ judge, index }: { judge: JudgeLeaderboardEntry; index: number }) {
  const rank = judge.rank || index + 1;
  const isTop3 = rank <= 3;

  return (
    <Link to={`/judge/${judge.username}`}>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-surface-1 group',
          isTop3 && 'bg-gradient-to-r from-gold/5 to-transparent border border-gold/20'
        )}
      >
        {/* Rank */}
        <div className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
          rank === 1 && 'bg-gold/20 text-gold',
          rank === 2 && 'bg-zinc-500/20 text-zinc-400',
          rank === 3 && 'bg-amber-700/20 text-amber-600',
          rank > 3 && 'bg-surface-1 text-muted-foreground'
        )}>
          {getRankIcon(rank) || rank}
        </div>

        {/* Avatar */}
        <div className="relative shrink-0">
          {judge.avatar_url ? (
            <img 
              src={judge.avatar_url} 
              alt={judge.username}
              className="w-10 h-10 rounded-full object-cover border border-gold/30"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
              <Gavel size={16} className="text-gold" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-sm truncate">
              {judge.display_name || judge.username}
            </span>
            {judge.verification_status && <VerifiedBadge size="sm" />}
            <JudgeLevelBadge level={judge.judge_level} size="xs" showIcon={false} />
          </div>
          <p className="text-[11px] text-muted-foreground">@{judge.username}</p>
        </div>

        {/* Stats */}
        <div className="text-right shrink-0">
          <div className="text-sm font-bold text-gold">{judge.judge_xp.toLocaleString()}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">JXP</div>
        </div>

        <ChevronRight size={16} className="text-muted-foreground group-hover:text-gold transition-colors shrink-0" />
      </motion.div>
    </Link>
  );
}

interface JudgeLeaderboardCardProps {
  compact?: boolean;
  limit?: number;
}

export default function JudgeLeaderboardCard({ compact = false, limit = 10 }: JudgeLeaderboardCardProps) {
  const [mode, setMode] = useState<'weekly' | 'alltime'>('weekly');
  const { judges, loading } = useJudgeLeaderboard(mode, limit);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-gold" />
            <h3 className="font-display text-sm tracking-wide">JUDGE LEADERBOARD</h3>
          </div>
          {judges.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Flame size={12} className="text-orange-400" />
              {judges[0]?.weeklyReviews || 0} reviews this week
            </div>
          )}
        </div>
        
        <Tabs value={mode} onValueChange={(v) => setMode(v as 'weekly' | 'alltime')}>
          <TabsList className="w-full h-8 bg-surface-1">
            <TabsTrigger value="weekly" className="flex-1 text-xs h-full data-[state=active]:bg-gold/20 data-[state=active]:text-gold">
              This Week
            </TabsTrigger>
            <TabsTrigger value="alltime" className="flex-1 text-xs h-full data-[state=active]:bg-gold/20 data-[state=active]:text-gold">
              All Time
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="p-2">
        {loading ? (
          <div className="space-y-2 p-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-surface-1 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : judges.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No judges yet
          </div>
        ) : (
          <div className="space-y-1">
            {judges.map((judge, i) => (
              <JudgeRow key={judge.id} judge={judge} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
