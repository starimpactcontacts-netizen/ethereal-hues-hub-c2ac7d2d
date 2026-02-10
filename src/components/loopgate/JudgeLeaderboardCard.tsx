import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Flame, Crown, Medal, ChevronRight, Gavel, Shield } from 'lucide-react';
import { useJudgeLeaderboard, JudgeLeaderboardEntry } from '@/hooks/useJudgeLeaderboard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import JudgeLevelBadge from './JudgeLevelBadge';
import JudgeClassBadge from './JudgeClassBadge';
import VerifiedBadge from './VerifiedBadge';
import { cn } from '@/lib/utils';

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown size={14} className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />;
  if (rank === 2) return <Medal size={12} className="text-zinc-400" />;
  if (rank === 3) return <Medal size={12} className="text-amber-700" />;
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
        transition={{ delay: index * 0.04 }}
        className={cn(
          'flex items-center gap-2.5 p-2.5 rounded-lg transition-all hover:bg-surface-1 group relative overflow-hidden',
          isTop3 && 'bg-gradient-to-r from-gold/8 to-transparent'
        )}
      >
        {/* Shimmer for #1 */}
        {rank === 1 && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -inset-full animate-shimmer bg-gradient-to-r from-transparent via-white/3 to-transparent" />
          </div>
        )}

        {/* Rank */}
        <div className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
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
              className={cn(
                "w-9 h-9 rounded-full object-cover border",
                rank === 1 ? "border-gold/40 shadow-[0_0_12px_rgba(212,175,55,0.2)]" : "border-gold/20"
              )}
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center">
              <Gavel size={14} className="text-gold" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-medium text-sm truncate">
              {judge.display_name || judge.username}
            </span>
            {judge.verification_status && <VerifiedBadge size="sm" />}
          </div>
          <div className="flex items-center gap-1.5">
            <JudgeClassBadge reviewCount={judge.judge_review_count} size="sm" />
            <JudgeLevelBadge level={judge.judge_level} size="xs" showIcon={false} />
          </div>
        </div>

        {/* Stats */}
        <div className="text-right shrink-0">
          <div className={cn(
            "text-sm font-bold",
            rank === 1 ? "text-gold" : "text-foreground"
          )}>{judge.judge_xp.toLocaleString()}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">JXP</div>
        </div>

        <ChevronRight size={14} className="text-muted-foreground group-hover:text-gold transition-colors shrink-0" />
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
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gold/15 flex items-center justify-center">
              <Shield size={12} className="text-gold" />
            </div>
            <h3 className="font-display text-xs tracking-wide">JUDGE INDEX</h3>
          </div>
          {judges.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Flame size={10} className="text-orange-400" />
              {judges[0]?.weeklyReviews || 0} reviews this week
            </div>
          )}
        </div>
        
        <Tabs value={mode} onValueChange={(v) => setMode(v as 'weekly' | 'alltime')}>
          <TabsList className="w-full h-7 bg-surface-1 p-0.5">
            <TabsTrigger value="weekly" className="flex-1 text-[11px] h-full data-[state=active]:bg-gold/20 data-[state=active]:text-gold rounded-md">
              This Week
            </TabsTrigger>
            <TabsTrigger value="alltime" className="flex-1 text-[11px] h-full data-[state=active]:bg-gold/20 data-[state=active]:text-gold rounded-md">
              All Time
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="p-1.5">
        {loading ? (
          <div className="space-y-1.5 p-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-surface-1 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : judges.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-xs">
            No judges yet
          </div>
        ) : (
          <div className="space-y-0.5">
            {judges.map((judge, i) => (
              <JudgeRow key={judge.id} judge={judge} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Footer - view all link */}
      {judges.length > 0 && (
        <div className="px-3 pb-2.5">
          <Link 
            to="/judges/leaderboard"
            className="flex items-center justify-center gap-1 text-[11px] text-gold hover:underline py-1.5"
          >
            View Full Judge Index
            <ChevronRight size={12} />
          </Link>
        </div>
      )}
    </div>
  );
}
