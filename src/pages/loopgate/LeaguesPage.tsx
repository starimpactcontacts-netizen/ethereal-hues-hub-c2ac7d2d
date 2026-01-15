import { motion } from 'framer-motion';
import { Shield, Star, Crown, Skull, Lock, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRealRankings } from '@/hooks/useRealData';

const leagues = [
  {
    id: 'cartel',
    name: 'CARTEL',
    subtitle: 'THE BLACKLIST',
    icon: Skull,
    description: 'Invitation-only league for the top 0.1% of Loopgate editors. Maximum prestige, early access to features, and industry-level recognition.',
    badge: 'Top 0.1% + Invite',
    accentColor: 'gold',
    bgGradient: 'from-gold/20 via-black to-gold/10',
    borderColor: 'border-gold',
    textColor: 'text-gold',
    glowColor: 'shadow-gold/30',
    isSecret: true,
  },
  {
    id: 'elite',
    name: 'ELITE',
    subtitle: 'THE 1%',
    icon: Crown,
    description: 'The top 1% of editors worldwide. Elite-only events, high-visibility placements, and priority opportunities.',
    badge: 'Top 1%',
    accentColor: 'gold',
    bgGradient: 'from-gold/10 via-surface-1 to-gold/5',
    borderColor: 'border-gold/70',
    textColor: 'text-gold',
    glowColor: 'shadow-gold/20',
    isSecret: false,
  },
  {
    id: 'pro',
    name: 'PRO',
    subtitle: 'THE ASCENDED',
    icon: Star,
    description: "Top 15% of ranked editors with at least one confirmed event win. You've shown real skill — now you refine it.",
    badge: 'Top 15% + 1 Win',
    accentColor: 'blue-500',
    bgGradient: 'from-blue-500/10 via-surface-1 to-blue-500/5',
    borderColor: 'border-blue-500/50',
    textColor: 'text-blue-400',
    glowColor: 'shadow-blue-500/20',
    isSecret: false,
  },
  {
    id: 'open',
    name: 'OPEN',
    subtitle: 'THE PIT',
    icon: Shield,
    description: 'Entry tier for all editors. Chaotic and competitive. This is where everyone starts and most remain. Climb out by proving yourself in live events.',
    badge: 'Default Tier',
    accentColor: 'gray',
    bgGradient: 'from-surface-1 via-surface-0 to-surface-1',
    borderColor: 'border-border',
    textColor: 'text-muted-foreground',
    glowColor: '',
    isSecret: false,
  },
];

const getProgressInfo = (userLeague: string, userPercentile: number | null, totalWins: number) => {
  if (userLeague === 'cartel') {
    return { current: 100, target: 100, label: 'Maximum tier reached', nextTier: null };
  }
  if (userLeague === 'elite') {
    return { 
      current: 99, 
      target: 100, 
      label: 'Cartel requires invitation', 
      nextTier: 'CARTEL',
      requirement: 'Top 0.1% + Invitation'
    };
  }
  if (userLeague === 'pro') {
    const progress = userPercentile ? Math.min(99, 100 - userPercentile) : 50;
    return { 
      current: progress, 
      target: 99, 
      label: `Reach Top 1% for Elite`, 
      nextTier: 'ELITE',
      requirement: 'Top 1% Global Ranking'
    };
  }
  // Open league
  const hasWin = totalWins > 0;
  const inTop15 = userPercentile !== null && userPercentile <= 15;
  const progress = hasWin && inTop15 ? 100 : hasWin ? 50 : inTop15 ? 50 : 0;
  return { 
    current: progress, 
    target: 100, 
    label: hasWin 
      ? 'Reach Top 15% for Pro' 
      : inTop15 
        ? 'Win 1 event for Pro' 
        : 'Win + Top 15% for Pro',
    nextTier: 'PRO',
    requirement: 'Top 15% + 1 Event Win'
  };
};

export default function LeaguesPage() {
  const { profile, loading: authLoading } = useAuth();
  const { rankings, loading: rankingsLoading } = useRealRankings();

  const loading = authLoading || rankingsLoading;

  // Find user's rank position
  const userRank = profile 
    ? rankings.findIndex(r => r.id === profile.id) + 1 
    : null;
  
  const totalUsers = rankings.length;
  const userPercentile = userRank && totalUsers > 0 
    ? (userRank / totalUsers) * 100
    : null;

  const userLeague = profile?.league || 'open';
  const totalWins = profile?.total_wins || 0;
  const progressInfo = getProgressInfo(userLeague, userPercentile, totalWins);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Section - no sticky header here since we're inside Index */}
      <div className="px-4 pt-6 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] mb-2">
            COMPETITIVE TIERS BASED ON PERFORMANCE
          </p>
        </motion.div>
      </div>

      {/* League Cards */}
      <div className="px-4 space-y-4">
        {leagues.map((league, index) => {
          const isCurrentLeague = userLeague === league.id;
          const isLocked = !isCurrentLeague && (
            (league.id === 'cartel') ||
            (league.id === 'elite' && userLeague !== 'elite' && userLeague !== 'cartel') ||
            (league.id === 'pro' && userLeague === 'open')
          );
          const showGlow = league.id === 'cartel' || league.id === 'elite';
          
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
              
              {/* Secret badge for Cartel */}
              {league.isSecret && (
                <div className="absolute top-0 right-0 bg-gold text-background text-[8px] font-bold uppercase tracking-wider px-2 py-0.5">
                  SECRET
                </div>
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

                {/* Badge Requirement */}
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-1 border ${league.borderColor} ${league.textColor} bg-surface-0`}>
                      {league.badge}
                    </span>
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
          Leagues update automatically based on your Index score
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
            <div className={`bg-surface-1 border-l-4 ${
              userLeague === 'cartel' ? 'border-gold' :
              userLeague === 'elite' ? 'border-gold/70' : 
              userLeague === 'pro' ? 'border-blue-500/50' : 
              'border-border'
            } p-5`}>
              {/* Current League */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-1">
                    Current League
                  </p>
                  <p className="font-display text-3xl text-gold uppercase">{userLeague}</p>
                </div>
                {userRank && (
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-1">Global Rank</p>
                    <p className="font-display text-2xl">#{userRank}</p>
                  </div>
                )}
              </div>

              {/* Stats */}
              {userPercentile !== null && (
                <div className="grid grid-cols-3 gap-4 mb-6 py-4 border-y border-border/50">
                  <div className="text-center">
                    <p className="font-display text-xl text-foreground">Top {userPercentile.toFixed(1)}%</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Percentile</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display text-xl text-foreground">{totalWins}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Event Wins</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display text-xl text-foreground">{profile.total_events || 0}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Events</p>
                  </div>
                </div>
              )}

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
                  <span className="text-gold font-display text-lg">Maximum tier reached</span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-surface-1 border border-border p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Sign up to track your league progression
              </p>
              <p className="text-xs text-gold">
                Everyone starts in THE PIT. Climb out.
              </p>
            </div>
          )}
        </motion.div>
      </section>
    </div>
  );
}
