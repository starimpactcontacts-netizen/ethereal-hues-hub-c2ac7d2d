import { motion } from 'framer-motion';
import { Gavel, Clock, TrendingUp, Flame, Star } from 'lucide-react';
import { useJudgeStats } from '@/hooks/useJudgeLeaderboard';
import JudgeLevelBadge from './JudgeLevelBadge';
import JudgeXPProgressBar from './JudgeXPProgressBar';
import { useAuth } from '@/hooks/useAuth';

export default function JudgePanelStats() {
  const { user } = useAuth();
  const { stats, loading } = useJudgeStats(user?.id);

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-14 bg-zinc-900 animate-pulse" />
        <div className="grid grid-cols-4 gap-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-zinc-900 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-2">
      {/* XP Hero — single dense row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-zinc-900 border border-zinc-800 p-2.5"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gold/15 flex items-center justify-center">
              <Gavel size={14} className="text-gold" />
            </div>
            <div className="leading-none">
              <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Judge XP</p>
              <p className="text-lg font-display font-bold text-gold tabular-nums">{stats.judge_xp.toLocaleString()}</p>
            </div>
          </div>
          <JudgeLevelBadge level={stats.judge_level} size="md" />
        </div>
        <JudgeXPProgressBar 
          judgeXp={stats.judge_xp} 
          judgeLevel={stats.judge_level} 
          showPerk={false}
          size="sm"
        />
      </motion.div>

      {/* Stats Row — 4 compact cells */}
      <div className="grid grid-cols-4 gap-1">
        <StatCell 
          icon={<Clock size={12} className="text-gold" />}
          value={stats.pendingReviews}
          label="Queue"
          highlight={stats.pendingReviews > 0}
          delay={0.05}
        />
        <StatCell 
          icon={<TrendingUp size={12} className="text-zinc-400" />}
          value={stats.judge_review_count}
          label="Total"
          delay={0.1}
        />
        <StatCell 
          icon={<Flame size={12} className="text-orange-400" />}
          value={stats.weeklyReviews}
          label="Week"
          delay={0.15}
        />
        <StatCell 
          icon={<Star size={12} className="text-yellow-400" />}
          value={stats.avgScore.toFixed(0)}
          label="Avg"
          delay={0.2}
        />
      </div>
    </div>
  );
}

function StatCell({ 
  icon, value, label, highlight, delay = 0 
}: { 
  icon: React.ReactNode; 
  value: number | string; 
  label: string; 
  highlight?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`bg-zinc-900 border ${highlight ? 'border-gold/40' : 'border-zinc-800'} p-2 text-center`}
    >
      <div className="flex items-center justify-center mb-0.5">{icon}</div>
      <p className={`text-base font-display font-bold tabular-nums ${highlight ? 'text-gold' : 'text-white'}`}>
        {value}
      </p>
      <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono">{label}</p>
    </motion.div>
  );
}
