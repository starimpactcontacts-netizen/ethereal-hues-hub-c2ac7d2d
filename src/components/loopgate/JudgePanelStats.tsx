import { motion } from 'framer-motion';
import { Gavel, Clock, Star, Flame, TrendingUp } from 'lucide-react';
import { useJudgeStats } from '@/hooks/useJudgeLeaderboard';
import JudgeLevelBadge from './JudgeLevelBadge';
import JudgeXPProgressBar from './JudgeXPProgressBar';
import { useAuth } from '@/hooks/useAuth';

export default function JudgePanelStats() {
  const { user } = useAuth();
  const { stats, loading } = useJudgeStats(user?.id);

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <div className="h-20 bg-surface-1 rounded-xl animate-pulse" />
        <div className="grid grid-cols-3 gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-surface-1 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-4">
      {/* JXP Progress Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gold/10 via-card to-amber-900/10 border border-gold/30 rounded-xl p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
              <Gavel size={18} className="text-gold" />
            </div>
            <div>
              <p className="text-sm font-display">JUDGE XP</p>
              <p className="text-2xl font-bold text-gold">{stats.judge_xp.toLocaleString()}</p>
            </div>
          </div>
          <JudgeLevelBadge level={stats.judge_level} size="lg" />
        </div>
        <JudgeXPProgressBar 
          judgeXp={stats.judge_xp} 
          judgeLevel={stats.judge_level} 
          showPerk 
        />
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface-1 border border-border rounded-xl p-3 text-center"
        >
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock size={14} className="text-gold" />
          </div>
          <p className="text-2xl font-display font-bold text-gold">{stats.pendingReviews}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pending</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-surface-1 border border-border rounded-xl p-3 text-center"
        >
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp size={14} className="text-foreground" />
          </div>
          <p className="text-2xl font-display font-bold">{stats.judge_review_count}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface-1 border border-border rounded-xl p-3 text-center"
        >
          <div className="flex items-center justify-center gap-1 mb-1">
            <Flame size={14} className="text-orange-400" />
          </div>
          <p className="text-2xl font-display font-bold text-orange-400">{stats.weeklyReviews}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">This Week</p>
        </motion.div>
      </div>

      {/* Average Score */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-surface-1 border border-border rounded-xl p-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Star size={16} className="text-yellow-400" />
          <span className="text-sm text-muted-foreground">Average Score Given</span>
        </div>
        <span className="text-lg font-bold">{stats.avgScore.toFixed(1)}</span>
      </motion.div>
    </div>
  );
}
