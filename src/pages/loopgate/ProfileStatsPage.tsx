import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Zap, Award, Star, Clock, Target, Flame, Trophy, Grid3X3, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRealRankings } from "@/hooks/useRealData";
import { useXP, getXPForNextLevel, getXPForCurrentLevel } from "@/hooks/useXP";
import { useUserSubmissions } from "@/hooks/useUserSubmissions";
import { useReviewRequests } from "@/hooks/useReviewRequests";
import { useUserActivityStats } from "@/hooks/useUserActivityStats";
import { motion } from "framer-motion";
import XPProgressBar from "@/components/loopgate/XPProgressBar";
import XPHistory from "@/components/loopgate/XPHistory";
import { getRankFromScore } from "@/data/gqtConfig";

export default function ProfileStatsPage() {
  const navigate = useNavigate();
  const { profile, user, loading: authLoading } = useAuth();
  const { rankings } = useRealRankings();
  const { xp, level, streak } = useXP();
  const { submissions } = useUserSubmissions();
  const { completedReviews, pendingReviews } = useReviewRequests();
  const activityStats = useUserActivityStats(user?.id);

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const userRanking = rankings.find(r => r.id === profile.id);
  const userRank = userRanking?.rank || (rankings.length > 0 ? rankings.length + 1 : '—');
  
  // Get class info
  const bestGQT = (profile as any).best_gatekeeper_qoi;
  const hasTakenGQT = bestGQT && bestGQT > 0;
  const rankConfig = hasTakenGQT ? getRankFromScore(bestGQT) : null;
  const classLetter = rankConfig?.rank || (level >= 2 ? 'D' : 'F');
  
  const classColors: Record<string, string> = {
    'S++': 'text-gold bg-gold/15 border-gold',
    'S+': 'text-gold bg-gold/10 border-gold/60',
    'S': 'text-amber-400 bg-amber-400/10 border-amber-400/60',
    'A': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/60',
    'B': 'text-blue-400 bg-blue-400/10 border-blue-400/60',
    'C': 'text-slate-300 bg-slate-400/10 border-slate-400/40',
    'D': 'text-orange-400 bg-orange-500/10 border-orange-500/40',
    'F': 'text-muted-foreground bg-muted/10 border-border',
  };

  const winRate = activityStats.totalEvents > 0 
    ? activityStats.winRate.toFixed(0) 
    : '0';
    
  const currentLevelXP = getXPForCurrentLevel(level);
  const nextLevelXP = getXPForNextLevel(level);
  const xpToNextLevel = nextLevelXP - xp;
  const currentStreak = streak?.current_streak || 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-20">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate('/profile')} className="p-2 -ml-2 hover:bg-surface-1 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-xl">Stats</h1>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 space-y-6"
      >
        {/* ─── XP & Level ─── */}
        <section className="space-y-3">
          <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Experience</h3>
          <div className="bg-surface-1 border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="font-display text-2xl">LV {level}</p>
                  <p className="text-xs text-muted-foreground">{xp.toLocaleString()} XP Total</p>
                </div>
              </div>
              {currentStreak > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-status-live/10 border border-status-live/30 rounded-lg">
                  <Flame className="w-4 h-4 text-status-live" />
                  <span className="text-sm font-medium text-status-live">{currentStreak}d</span>
                </div>
              )}
            </div>
            <XPProgressBar xp={xp} level={level} size="md" />
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {xpToNextLevel} XP to Level {level + 1}
            </p>
          </div>
        </section>

        {/* ─── Core Stats Grid ─── */}
        <section className="space-y-3">
          <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Performance</h3>
          <div className="grid grid-cols-2 gap-3">
            {/* Class */}
            <Link to="/gqt" className={`bg-surface-1 border rounded-xl p-4 flex flex-col items-center justify-center ${classColors[classLetter]} hover:scale-[1.02] transition-transform`}>
              <span className="font-display text-3xl">{classLetter}</span>
              <span className="text-[10px] uppercase tracking-wider opacity-70 mt-1">Class</span>
            </Link>
            
            {/* Rank */}
            <div className="bg-surface-1 border border-border rounded-xl p-4 flex flex-col items-center justify-center">
              <span className="font-display text-3xl">#{userRank}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Global Rank</span>
            </div>
            
            {/* Index Score */}
            <div className="bg-surface-1 border border-border rounded-xl p-4 flex flex-col items-center justify-center">
              <span className="font-display text-3xl">{Number(profile.global_index_score || 0).toFixed(1)}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Index Score</span>
            </div>
            
            {/* Win Rate */}
            <div className="bg-surface-1 border border-border rounded-xl p-4 flex flex-col items-center justify-center">
              <span className="font-display text-3xl">{winRate}%</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Win Rate</span>
            </div>
          </div>
        </section>

        {/* ─── Activity Stats ─── */}
        <section className="space-y-3">
          <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Activity</h3>
          <div className="bg-surface-1 border border-border rounded-xl divide-y divide-border">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Grid3X3 className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm">Total Edits</span>
              </div>
              <span className="font-display text-lg">{submissions.length}</span>
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm">Events Entered</span>
              </div>
              <span className="font-display text-lg">{activityStats.totalEvents}</span>
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-emerald-400" />
                <span className="text-sm">Wins</span>
              </div>
              <span className="font-display text-lg text-emerald-400">{activityStats.totalWins}</span>
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-purple-400" />
                <span className="text-sm">Reviews Received</span>
              </div>
              <span className="font-display text-lg">{completedReviews.length}</span>
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-orange-400" />
                <span className="text-sm">Pending Reviews</span>
              </div>
              <span className="font-display text-lg text-orange-400">{pendingReviews.length}</span>
            </div>
          </div>
        </section>

        {/* ─── GQT Score ─── */}
        <section className="space-y-3">
          <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Gatekeeper Quotient</h3>
          <Link to="/gqt">
            <div className="bg-surface-1 border border-border rounded-xl p-4 hover:border-foreground/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Best GQT Score</p>
                    <p className="text-xs text-muted-foreground">
                      {hasTakenGQT ? `${bestGQT} points` : 'Not yet tested'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {hasTakenGQT && (
                    <span className={`font-display text-xl ${classColors[classLetter]?.split(' ')[0]}`}>
                      {classLetter}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </Link>
        </section>

        {/* ─── XP History ─── */}
        <section className="space-y-3">
          <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Recent XP Activity</h3>
          <XPHistory />
        </section>
      </motion.div>
    </div>
  );
}
