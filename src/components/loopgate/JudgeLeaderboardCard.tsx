import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useJudgeLeaderboard, JudgeLeaderboardEntry } from '@/hooks/useJudgeLeaderboard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import JudgeLevelBadge from './JudgeLevelBadge';
import JudgeClassBadge from './JudgeClassBadge';
import VerifiedBadge from './VerifiedBadge';
import { cn } from '@/lib/utils';

function JudgeRow({ judge, index }: { judge: JudgeLeaderboardEntry; index: number }) {
  const rank = judge.rank || index + 1;
  const isTop3 = rank <= 3;

  return (
    <Link to={`/judge/${judge.username}`}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.03 }}
        className={cn(
          'flex items-center gap-2.5 py-2.5 px-3 transition-all hover:bg-white/[0.03] group',
          isTop3 && 'border-l-2 border-l-red-700',
          !isTop3 && 'border-l-2 border-l-transparent'
        )}
      >
        {/* Rank */}
        <span className={cn(
          'text-[11px] font-mono w-5 text-right shrink-0',
          rank === 1 && 'text-white font-bold',
          rank === 2 && 'text-zinc-400',
          rank === 3 && 'text-zinc-500',
          rank > 3 && 'text-zinc-700'
        )}>
          {String(rank).padStart(2, '0')}
        </span>

        {/* Avatar */}
        <div className="shrink-0">
          {judge.avatar_url ? (
            <img
              src={judge.avatar_url}
              alt={judge.username}
              className={cn(
                "w-8 h-8 rounded-sm object-cover",
                rank === 1 ? "grayscale-0" : "grayscale-[30%] group-hover:grayscale-0 transition-all"
              )}
            />
          ) : (
            <div className="w-8 h-8 rounded-sm bg-zinc-900 flex items-center justify-center text-[10px] font-bold text-zinc-600">
              {judge.username[0]?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-display text-[12px] text-white truncate tracking-wide">
              {(judge.display_name || judge.username).toUpperCase()}
            </span>
            {judge.verification_status && <VerifiedBadge size="sm" />}
          </div>
          <div className="flex items-center gap-1.5">
            <JudgeClassBadge reviewCount={judge.judge_review_count} size="sm" />
          </div>
        </div>

        {/* Stats */}
        <div className="text-right shrink-0">
          <div className={cn(
            "text-sm font-display",
            rank === 1 ? "text-white" : "text-zinc-300"
          )}>{judge.judge_xp.toLocaleString()}</div>
          <div className="text-[8px] text-zinc-600 uppercase tracking-wider font-mono">JXP</div>
        </div>

        <ChevronRight size={12} className="text-zinc-700 group-hover:text-red-400 transition-colors shrink-0" />
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
    <div className="border border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-red-700" />
            <h3 className="font-display text-xs tracking-[0.15em] text-white">RANKINGS BUREAU</h3>
          </div>
          {judges.length > 0 && (
            <div className="flex items-center gap-1 text-[9px] text-zinc-600 font-mono">
              <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
              {judges[0]?.weeklyReviews || 0} this week
            </div>
          )}
        </div>

        <Tabs value={mode} onValueChange={(v) => setMode(v as 'weekly' | 'alltime')}>
          <TabsList className="w-full h-7 bg-zinc-950 p-0.5 rounded-none">
            <TabsTrigger value="weekly" className="flex-1 text-[10px] h-full data-[state=active]:bg-white data-[state=active]:text-black font-mono uppercase tracking-wider rounded-none">
              This Week
            </TabsTrigger>
            <TabsTrigger value="alltime" className="flex-1 text-[10px] h-full data-[state=active]:bg-white data-[state=active]:text-black font-mono uppercase tracking-wider rounded-none">
              All Time
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div>
        {loading ? (
          <div className="space-y-0 p-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-11 bg-zinc-950 animate-pulse mb-px" />
            ))}
          </div>
        ) : judges.length === 0 ? (
          <div className="text-center py-8 text-zinc-600 text-[10px] font-mono uppercase tracking-wider">
            No records filed
          </div>
        ) : (
          <div>
            {judges.map((judge, i) => (
              <div key={judge.id}>
                <JudgeRow judge={judge} index={i} />
                {i < judges.length - 1 && <div className="h-px bg-zinc-900 ml-8" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {judges.length > 0 && (
        <div className="border-t border-zinc-800 px-3 py-2.5">
          <Link
            to="/judges/leaderboard"
            className="flex items-center justify-center gap-1 text-[10px] text-red-400 hover:text-red-300 font-mono uppercase tracking-wider py-1"
          >
            View Full Index
            <ChevronRight size={10} />
          </Link>
        </div>
      )}
    </div>
  );
}
