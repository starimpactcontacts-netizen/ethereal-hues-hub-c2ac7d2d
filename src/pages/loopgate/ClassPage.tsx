import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, Star, Crown, Flame, Lock, TrendingUp, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRealRankings } from '@/hooks/useRealData';
import { getRankFromScore, GQTRank, getIndexFloorFromRank } from '@/data/gqtConfig';
import { Button } from '@/components/ui/button';

// GQT Class System - Your class is your rank letter (F through S++)
const classes = [
  {
    rank: 'S++' as GQTRank,
    name: 'S++ CLASS',
    subtitle: 'LEGENDARY',
    icon: Flame,
    description: 'The apex of the editing world. Reserved for editors who have proven absolute mastery. Maximum prestige and recognition.',
    badge: 'Score 96+',
    bgGradient: 'from-gold/20 via-black to-gold/10',
    borderColor: 'border-gold',
    textColor: 'text-gold',
    glowColor: 'shadow-gold/30',
    indexFloor: 300,
  },
  {
    rank: 'S+' as GQTRank,
    name: 'S+ CLASS',
    subtitle: 'ELITE',
    icon: Flame,
    description: 'Elite editors at the peak of competitive editing. Your work stands among the very best in the world.',
    badge: 'Score 90-95',
    bgGradient: 'from-gold/15 via-black to-gold/5',
    borderColor: 'border-gold/80',
    textColor: 'text-gold',
    glowColor: 'shadow-gold/20',
    indexFloor: 200,
  },
  {
    rank: 'S' as GQTRank,
    name: 'S CLASS',
    subtitle: 'MASTER',
    icon: Crown,
    description: 'Top-tier editors with professional-grade work. You\'ve proven you can compete with the best.',
    badge: 'Score 80-89',
    bgGradient: 'from-amber-400/10 via-surface-1 to-amber-400/5',
    borderColor: 'border-amber-400',
    textColor: 'text-amber-400',
    glowColor: 'shadow-amber-400/20',
    indexFloor: 120,
  },
  {
    rank: 'A' as GQTRank,
    name: 'A CLASS',
    subtitle: 'ADVANCED',
    icon: Zap,
    description: 'Skilled editors entering the pro conversation. Clear artistic intention with solid execution.',
    badge: 'Score 70-79',
    bgGradient: 'from-emerald-400/10 via-surface-1 to-emerald-400/5',
    borderColor: 'border-emerald-400',
    textColor: 'text-emerald-400',
    glowColor: 'shadow-emerald-400/20',
    indexFloor: 75,
  },
  {
    rank: 'B' as GQTRank,
    name: 'B CLASS',
    subtitle: 'SKILLED',
    icon: Star,
    description: 'Above-average editors with solid fundamentals. You understand the rules — now learn to break them.',
    badge: 'Score 60-69',
    bgGradient: 'from-blue-500/10 via-surface-1 to-blue-500/5',
    borderColor: 'border-blue-500/50',
    textColor: 'text-blue-400',
    glowColor: '',
    indexFloor: 40,
  },
  {
    rank: 'C' as GQTRank,
    name: 'C CLASS',
    subtitle: 'CONTRIBUTOR',
    icon: Shield,
    description: 'Average editors building their foundation. Technically competent work that needs more soul and identity.',
    badge: 'Score 50-59',
    bgGradient: 'from-slate-400/10 via-surface-0 to-slate-400/5',
    borderColor: 'border-slate-400/50',
    textColor: 'text-slate-300',
    glowColor: '',
    indexFloor: 20,
  },
  {
    rank: 'D' as GQTRank,
    name: 'D CLASS',
    subtitle: 'BEGINNER',
    icon: Shield,
    description: 'Developing editors learning the craft. Keep practicing and experimenting with your style.',
    badge: 'Score 40-49',
    bgGradient: 'from-orange-500/10 via-surface-0 to-orange-500/5',
    borderColor: 'border-orange-500/40',
    textColor: 'text-orange-400',
    glowColor: '',
    indexFloor: 10,
  },
  {
    rank: 'F' as GQTRank,
    name: 'F CLASS',
    subtitle: 'UNRANKED',
    icon: Shield,
    description: 'Default class for all new editors. Take the Global QOI Test or reach Level 2 to get classified.',
    badge: 'Score 0-39',
    bgGradient: 'from-surface-1 via-surface-0 to-surface-1',
    borderColor: 'border-border',
    textColor: 'text-muted-foreground',
    glowColor: '',
    indexFloor: 0,
  },
];

// Get user's class from their best GQT score
const getClassFromScore = (score: number | null, level: number): typeof classes[0] => {
  // Users at level 2+ without a score get D class minimum
  if (!score || score === 0) {
    if (level >= 2) return classes.find(c => c.rank === 'D')!;
    return classes[classes.length - 1]; // F
  }
  if (score >= 96) return classes[0]; // S++
  if (score >= 90) return classes[1]; // S+
  if (score >= 80) return classes[2]; // S
  if (score >= 70) return classes[3]; // A
  if (score >= 60) return classes[4]; // B
  if (score >= 50) return classes[5]; // C
  if (score >= 40) return classes[6]; // D
  return classes[7]; // F
};

const getProgressInfo = (currentScore: number | null, level: number) => {
  const score = currentScore || 0;
  
  if (score >= 96) {
    return { 
      current: 100, 
      target: 100, 
      label: 'S++ CLASS — Maximum tier achieved',
      nextClass: null,
      requirement: 'You are at the top'
    };
  }
  if (score >= 90) {
    return { 
      current: Math.round(((score - 90) / 6) * 100), 
      target: 100, 
      label: 'Reach S++ CLASS (96+)', 
      nextClass: 'S++',
      requirement: 'Score 96+ on GQT'
    };
  }
  if (score >= 80) {
    return { 
      current: Math.round(((score - 80) / 10) * 100), 
      target: 100, 
      label: 'Reach S+ CLASS (90+)', 
      nextClass: 'S+',
      requirement: 'Score 90+ on GQT'
    };
  }
  if (score >= 70) {
    return { 
      current: Math.round(((score - 70) / 10) * 100), 
      target: 100, 
      label: 'Reach S CLASS (80+)', 
      nextClass: 'S',
      requirement: 'Score 80+ on GQT'
    };
  }
  if (score >= 60) {
    return { 
      current: Math.round(((score - 60) / 10) * 100), 
      target: 100, 
      label: 'Reach A CLASS (70+)', 
      nextClass: 'A',
      requirement: 'Score 70+ on GQT'
    };
  }
  if (score >= 50) {
    return { 
      current: Math.round(((score - 50) / 10) * 100), 
      target: 100, 
      label: 'Reach B CLASS (60+)', 
      nextClass: 'B',
      requirement: 'Score 60+ on GQT'
    };
  }
  if (score >= 40) {
    return { 
      current: Math.round(((score - 40) / 10) * 100), 
      target: 100, 
      label: 'Reach C CLASS (50+)', 
      nextClass: 'C',
      requirement: 'Score 50+ on GQT'
    };
  }
  if (level >= 2) {
    return { 
      current: Math.round((score / 40) * 100), 
      target: 100, 
      label: 'Take the GQT to unlock higher classes', 
      nextClass: 'C',
      requirement: 'Score 50+ on GQT'
    };
  }
  return { 
    current: 0, 
    target: 100, 
    label: 'Take the GQT or reach Level 2 to get classified', 
    nextClass: 'D',
    requirement: 'Complete GQT or reach Level 2'
  };
};

export default function ClassPage() {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  const { rankings, loading: rankingsLoading } = useRealRankings();

  const loading = authLoading || rankingsLoading;

  // Get user's best GQT score and level
  const userBestGQT = profile?.best_gatekeeper_qoi || null;
  const userLevel = profile?.level || 1;
  const userClass = getClassFromScore(userBestGQT, userLevel);
  const progressInfo = getProgressInfo(userBestGQT, userLevel);

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
          <h1 className="font-display text-2xl text-gold mb-2">CLASS SYSTEM</h1>
          <p className="text-xs text-muted-foreground">
            Your class is determined by your best Global QOI Test score. Everyone starts at F Class until they take the GQT or reach Level 2.
          </p>
        </motion.div>
      </div>

      {/* Class Cards */}
      <div className="px-4 space-y-4">
        {classes.map((classItem, index) => {
          const isCurrentClass = userClass.rank === classItem.rank;
          const userScore = userBestGQT || 0;
          const isLocked = !isCurrentClass && (
            (classItem.rank === 'S++' && userScore < 96) ||
            (classItem.rank === 'S+' && userScore < 90) ||
            (classItem.rank === 'S' && userScore < 80) ||
            (classItem.rank === 'A' && userScore < 70) ||
            (classItem.rank === 'B' && userScore < 60) ||
            (classItem.rank === 'C' && userScore < 50) ||
            (classItem.rank === 'D' && userScore < 40 && userLevel < 2)
          );
          const showGlow = classItem.rank === 'S++' || classItem.rank === 'S+' || classItem.rank === 'S';
          
          return (
            <motion.div
              key={classItem.rank}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                relative overflow-hidden
                bg-gradient-to-br ${classItem.bgGradient}
                border-l-4 ${classItem.borderColor}
                ${isCurrentClass ? 'ring-2 ring-gold/50' : ''}
                ${showGlow && !isLocked ? `shadow-lg ${classItem.glowColor}` : ''}
              `}
            >
              {/* Animated glow for top tiers */}
              {showGlow && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/5 to-transparent animate-pulse" />
              )}
              
              <div className="relative p-5">
                {/* Current / Locked Badge */}
                {isCurrentClass ? (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 text-gold">
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-gold/20 px-2 py-1">Your Class</span>
                  </div>
                ) : isLocked && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 text-muted-foreground">
                    <Lock size={12} />
                    <span className="text-[10px] uppercase tracking-wider">Locked</span>
                  </div>
                )}

                {/* Icon + Name */}
                <div className="flex items-center gap-4 mb-3">
                  <div className={`w-12 h-12 bg-surface-0 border ${classItem.borderColor} flex items-center justify-center`}>
                    <classItem.icon size={24} className={classItem.textColor} strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className={`font-display text-3xl ${classItem.textColor}`}>{classItem.name}</h2>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">{classItem.subtitle}</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {classItem.description}
                </p>

                {/* Badge + Index Floor */}
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-1 border ${classItem.borderColor} ${classItem.textColor} bg-surface-0`}>
                      {classItem.badge}
                    </span>
                    {classItem.indexFloor > 0 && (
                      <span className="text-[10px] uppercase tracking-wider px-2 py-1 bg-gold/10 text-gold border border-gold/30">
                        +{classItem.indexFloor} INDEX
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
        
        {/* Footer tooltip */}
        <p className="text-center text-[10px] text-muted-foreground uppercase tracking-widest mt-6 px-4">
          Class updates automatically based on your GQT score
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
            <div className={`bg-surface-1 border-l-4 ${userClass.borderColor} p-5`}>
              {/* Current Class */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-1">
                    Current Class
                  </p>
                  <p className={`font-display text-3xl ${userClass.textColor}`}>{userClass.name}</p>
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
                    {userBestGQT ? getRankFromScore(userBestGQT).rank : userLevel >= 2 ? 'D' : 'F'}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase">Class</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-xl text-foreground">+{userClass.indexFloor}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Index Floor</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-xl text-foreground">{userRank ? `#${userRank}` : '--'}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Global Rank</p>
                </div>
              </div>

              {/* Progress Bar */}
              {progressInfo.nextClass && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground uppercase tracking-wider">
                      Next: {progressInfo.nextClass} Class
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

              {!progressInfo.nextClass && (
                <div className="py-2 text-center">
                  <span className="text-gold font-display text-lg">S++ CLASS — Maximum tier reached</span>
                </div>
              )}
              
              {/* Take GQT CTA */}
              {!userBestGQT && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <Button 
                    onClick={() => navigate('/gqt')}
                    className="w-full bg-gold text-background hover:bg-gold/90"
                  >
                    Take the Global QOI Test
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-surface-1 border border-border p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Take the Global QOI Test to get classified
              </p>
              <p className="text-xs text-gold">
                Your class is determined by your best GQT score
              </p>
            </div>
          )}
        </motion.div>
      </section>
    </div>
  );
}