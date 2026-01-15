import { motion } from 'framer-motion';
import { Shield, Star, Crown, Flame, Lock, TrendingUp, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRealRankings } from '@/hooks/useRealData';
import { gqtLeagues, getRankFromScore, getProjectedLeagueFromRank, GQTRank } from '@/data/gqtConfig';

// New GQT-based league system: Rookie → Contributor → Skilled → Advanced → Master → Legend
const leagues = [
  {
    id: 'legend',
    name: 'LEGEND',
    subtitle: 'S+ / S++ TIER',
    icon: Flame,
    description: 'The apex of the editing world. Reserved for S+ and S++ ranked editors who have proven absolute mastery. Maximum prestige and recognition.',
    badge: 'Score 90+',
    accentColor: 'gold',
    bgGradient: 'from-gold/20 via-black to-gold/10',
    borderColor: 'border-gold',
    textColor: 'text-gold',
    glowColor: 'shadow-gold/30',
    indexFloor: 200,
    minRank: 'S+' as GQTRank,
  },
  {
    id: 'master',
    name: 'MASTER',
    subtitle: 'S TIER',
    icon: Crown,
    description: 'Top-tier editors with professional-grade work. You\'ve proven you can compete with the best. Events and opportunities await.',
    badge: 'Score 80-89',
    accentColor: 'amber-400',
    bgGradient: 'from-amber-400/10 via-surface-1 to-amber-400/5',
    borderColor: 'border-amber-400',
    textColor: 'text-amber-400',
    glowColor: 'shadow-amber-400/20',
    indexFloor: 120,
    minRank: 'S' as GQTRank,
  },
  {
    id: 'advanced',
    name: 'ADVANCED',
    subtitle: 'A TIER',
    icon: Zap,
    description: 'Skilled editors entering the pro conversation. Clear artistic intention with solid execution. Keep pushing.',
    badge: 'Score 70-79',
    accentColor: 'emerald-400',
    bgGradient: 'from-emerald-400/10 via-surface-1 to-emerald-400/5',
    borderColor: 'border-emerald-400',
    textColor: 'text-emerald-400',
    glowColor: 'shadow-emerald-400/20',
    indexFloor: 75,
    minRank: 'A' as GQTRank,
  },
  {
    id: 'skilled',
    name: 'SKILLED',
    subtitle: 'B TIER',
    icon: Star,
    description: 'Above-average editors with solid fundamentals. You understand the rules — now learn to break them intentionally.',
    badge: 'Score 60-69',
    accentColor: 'blue-500',
    bgGradient: 'from-blue-500/10 via-surface-1 to-blue-500/5',
    borderColor: 'border-blue-500/50',
    textColor: 'text-blue-400',
    glowColor: 'shadow-blue-500/20',
    indexFloor: 40,
    minRank: 'B' as GQTRank,
  },
  {
    id: 'contributor',
    name: 'CONTRIBUTOR',
    subtitle: 'C TIER',
    icon: Shield,
    description: 'Average editors building their foundation. Technically competent work that needs more soul and identity.',
    badge: 'Score 50-59',
    accentColor: 'slate-400',
    bgGradient: 'from-slate-400/10 via-surface-0 to-slate-400/5',
    borderColor: 'border-slate-400/50',
    textColor: 'text-slate-300',
    glowColor: '',
    indexFloor: 20,
    minRank: 'C' as GQTRank,
  },
  {
    id: 'rookie',
    name: 'ROOKIE',
    subtitle: 'F / D TIER',
    icon: Shield,
    description: 'Entry tier for all editors. This is where you prove yourself. Master the basics, develop discipline, and climb.',
    badge: 'Score 0-49',
    accentColor: 'gray',
    bgGradient: 'from-surface-1 via-surface-0 to-surface-1',
    borderColor: 'border-border',
    textColor: 'text-muted-foreground',
    glowColor: '',
    indexFloor: 0,
    minRank: 'F' as GQTRank,
  },
];

// Determine user's league from their best GQT score
const getLeagueFromScore = (score: number | null): typeof leagues[0] => {
  if (!score) return leagues[leagues.length - 1]; // Rookie
  if (score >= 90) return leagues[0]; // Legend
  if (score >= 80) return leagues[1]; // Master
  if (score >= 70) return leagues[2]; // Advanced
  if (score >= 60) return leagues[3]; // Skilled
  if (score >= 50) return leagues[4]; // Contributor
  return leagues[5]; // Rookie
};

const getProgressInfo = (currentScore: number | null) => {
  const score = currentScore || 0;
  
  if (score >= 90) {
    const progress = score >= 96 ? 100 : Math.round(((score - 90) / 6) * 100);
    return { 
      current: progress, 
      target: 100, 
      label: score >= 96 ? 'S++ ACHIEVED — Maximum tier' : 'Reach S++ (96+) for absolute legend status',
      nextTier: score >= 96 ? null : 'S++',
      requirement: 'Score 96+ on GQT'
    };
  }
  if (score >= 80) {
    return { 
      current: Math.round(((score - 80) / 10) * 100), 
      target: 100, 
      label: 'Reach LEGEND (90+)', 
      nextTier: 'LEGEND',
      requirement: 'Score 90+ on GQT'
    };
  }
  if (score >= 70) {
    return { 
      current: Math.round(((score - 70) / 10) * 100), 
      target: 100, 
      label: 'Reach MASTER (80+)', 
      nextTier: 'MASTER',
      requirement: 'Score 80+ on GQT'
    };
  }
  if (score >= 60) {
    return { 
      current: Math.round(((score - 60) / 10) * 100), 
      target: 100, 
      label: 'Reach ADVANCED (70+)', 
      nextTier: 'ADVANCED',
      requirement: 'Score 70+ on GQT'
    };
  }
  if (score >= 50) {
    return { 
      current: Math.round(((score - 50) / 10) * 100), 
      target: 100, 
      label: 'Reach SKILLED (60+)', 
      nextTier: 'SKILLED',
      requirement: 'Score 60+ on GQT'
    };
  }
  if (score >= 40) {
    return { 
      current: Math.round(((score - 40) / 10) * 100), 
      target: 100, 
      label: 'Reach CONTRIBUTOR (50+)', 
      nextTier: 'CONTRIBUTOR',
      requirement: 'Score 50+ on GQT'
    };
  }
  return { 
    current: Math.round((score / 40) * 100), 
    target: 100, 
    label: 'Take the GQT to get ranked', 
    nextTier: 'CONTRIBUTOR',
    requirement: 'Complete your first GQT'
  };
};

export default function LeaguesPage() {
  const { profile, loading: authLoading } = useAuth();
  const { rankings, loading: rankingsLoading } = useRealRankings();

  const loading = authLoading || rankingsLoading;

  // Get user's best GQT score
  const userBestGQT = profile?.best_gatekeeper_qoi || null;
  const userLeague = getLeagueFromScore(userBestGQT);
  const progressInfo = getProgressInfo(userBestGQT);

  // Find user's rank position
  const userRank = profile 
    ? rankings.findIndex(r => r.id === profile.id) + 1 
    : null;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Section */}
      <div className="px-4 pt-6 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] mb-2">
            GQT-BASED COMPETITIVE TIERS
          </p>
          <p className="text-xs text-muted-foreground">
            Your league is determined by your best Global QOI Test score
          </p>
        </motion.div>
      </div>

      {/* League Cards */}
      <div className="px-4 space-y-4">
        {leagues.map((league, index) => {
          const isCurrentLeague = userLeague.id === league.id;
          const userScore = userBestGQT || 0;
          const isLocked = !isCurrentLeague && (
            (league.id === 'legend' && userScore < 90) ||
            (league.id === 'master' && userScore < 80) ||
            (league.id === 'advanced' && userScore < 70) ||
            (league.id === 'skilled' && userScore < 60) ||
            (league.id === 'contributor' && userScore < 50)
          );
          const showGlow = league.id === 'legend' || league.id === 'master';
          
          return (
            <motion.div
              key={league.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                relative overflow-hidden
                bg-gradient-to-br ${league.bgGradient}
                border-l-4 ${league.borderColor}
                ${isCurrentLeague ? 'ring-2 ring-gold/50' : ''}
                ${showGlow && !isLocked ? `shadow-lg ${league.glowColor}` : ''}
              `}
            >
              {/* Animated glow for top tiers */}
              {showGlow && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/5 to-transparent animate-pulse" />
              )}
              
              <div className="relative p-5">
                {/* Current / Locked Badge */}
                {isCurrentLeague ? (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 text-gold">
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-gold/20 px-2 py-1">Your League</span>
                  </div>
                ) : isLocked && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 text-muted-foreground">
                    <Lock size={12} />
                    <span className="text-[10px] uppercase tracking-wider">Locked</span>
                  </div>
                )}

                {/* Icon + Name */}
                <div className="flex items-center gap-4 mb-3">
                  <div className={`w-12 h-12 bg-surface-0 border ${league.borderColor} flex items-center justify-center`}>
                    <league.icon size={24} className={league.textColor} strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className={`font-display text-3xl ${league.textColor}`}>{league.name}</h2>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">{league.subtitle}</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {league.description}
                </p>

                {/* Badge + Index Floor */}
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-1 border ${league.borderColor} ${league.textColor} bg-surface-0`}>
                      {league.badge}
                    </span>
                    {league.indexFloor > 0 && (
                      <span className="text-[10px] uppercase tracking-wider px-2 py-1 bg-gold/10 text-gold border border-gold/30">
                        +{league.indexFloor} INDEX
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Tier {leagues.length - index}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
        
        {/* Footer tooltip */}
        <p className="text-center text-[10px] text-muted-foreground uppercase tracking-widest mt-6 px-4">
          Leagues update automatically based on your GQT score
        </p>
      </div>

      {/* User Status & Progression */}
      <section className="px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="font-display text-xl mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gold" />
            Your Progression
          </h3>
          
          {loading ? (
            <div className="bg-surface-1 border border-border p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-8 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            </div>
          ) : profile ? (
            <div className={`bg-surface-1 border-l-4 ${userLeague.borderColor} p-5`}>
              {/* Current League */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-1">
                    Current League
                  </p>
                  <p className={`font-display text-3xl ${userLeague.textColor}`}>{userLeague.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-1">Best GQT Score</p>
                  <p className="font-display text-2xl">
                    {userBestGQT ? `${userBestGQT.toFixed(0)}/100` : '--'}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6 py-4 border-y border-border/50">
                <div className="text-center">
                  <p className="font-display text-xl text-foreground">
                    {userBestGQT ? getRankFromScore(userBestGQT).rank : '--'}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase">GQT Rank</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-xl text-foreground">+{userLeague.indexFloor}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Index Floor</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-xl text-foreground">{userRank ? `#${userRank}` : '--'}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Global Rank</p>
                </div>
              </div>

              {/* Progress Bar */}
              {progressInfo.nextTier && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground uppercase tracking-wider">
                      Next: {progressInfo.nextTier}
                    </span>
                    <span className="text-gold font-semibold">
                      {progressInfo.requirement}
                    </span>
                  </div>
                  <div className="h-2 bg-surface-0 border border-border overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(progressInfo.current / progressInfo.target) * 100}%` }}
                      transition={{ delay: 0.6, duration: 0.8 }}
                      className="h-full bg-gradient-to-r from-gold/50 to-gold"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {progressInfo.label}
                  </p>
                </div>
              )}

              {!progressInfo.nextTier && (
                <div className="py-2 text-center">
                  <span className="text-gold font-display text-lg">S++ — Maximum tier reached</span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-surface-1 border border-border p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Take the Global QOI Test to get ranked
              </p>
              <p className="text-xs text-gold">
                Your league is determined by your best GQT score
              </p>
            </div>
          )}
        </motion.div>
      </section>
    </div>
  );
}
