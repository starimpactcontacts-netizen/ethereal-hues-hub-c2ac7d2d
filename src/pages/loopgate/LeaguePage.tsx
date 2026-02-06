import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Crown, Shield, Star, Lock, Trophy, TrendingUp, ChevronRight, CheckCircle, Clock, XCircle, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRealRankings } from '@/hooks/useRealData';
import { useLeagueApplications } from '@/hooks/useLeagueApplications';
import { Button } from '@/components/ui/button';

const leagues = [
  {
    id: 'elite',
    name: 'ELITE LEAGUE',
    subtitle: 'INVITATION ONLY',
    icon: Crown,
    description: 'The highest tier. Reserved for editors who have dominated Pro League. By invitation only.',
    benefits: ['Exclusive events & prize pools', 'Priority judge reviews', 'Elite badge & profile frame', 'Direct access to enterprise sponsors'],
    requirement: 'Invitation from LOOPGATE administration',
    minWins: null,
    color: 'text-gold',
    border: 'border-gold',
    bg: 'from-gold/20 via-black to-gold/5',
    glow: 'shadow-gold/30',
  },
  {
    id: 'pro',
    name: 'PRO LEAGUE',
    subtitle: 'PROVEN COMPETITORS',
    icon: Star,
    description: 'For editors who have proven themselves in competition. Higher stakes, bigger rewards, elite recognition.',
    benefits: ['Pro-only Arena events', 'Higher Index multiplier', 'Pro League badge', 'Access to sponsored competitions'],
    requirement: '2+ Arena wins + Admin approval',
    minWins: 2,
    color: 'text-emerald-400',
    border: 'border-emerald-500',
    bg: 'from-emerald-500/15 via-black to-emerald-500/5',
    glow: 'shadow-emerald-500/20',
  },
  {
    id: 'open',
    name: 'OPEN LEAGUE',
    subtitle: 'ALL EDITORS',
    icon: Shield,
    description: 'The default league for all editors. Compete, earn wins, and prove you belong in Pro.',
    benefits: ['Access to all Open events', 'Standard Index scoring', 'Community competitions', 'Path to Pro League'],
    requirement: 'No requirements — everyone starts here',
    minWins: 0,
    color: 'text-blue-400',
    border: 'border-blue-500/50',
    bg: 'from-blue-500/10 via-surface-0 to-blue-500/5',
    glow: '',
  },
];

export default function LeaguePage() {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  const { rankings, loading: rankLoading } = useRealRankings();
  const { myApplication, loading: appLoading, applyForProLeague } = useLeagueApplications();

  const loading = authLoading || rankLoading || appLoading;
  const currentLeague = profile?.league || 'open';
  const totalWins = profile?.total_wins || 0;
  const meetsProRequirement = totalWins >= 2;

  // League-filtered rankings
  const leagueRankings = rankings.filter(r => (r as any).league === currentLeague);

  const getApplicationStatus = () => {
    if (!myApplication) return null;
    if (myApplication.status === 'pending') return { icon: Clock, text: 'Application Pending', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
    if (myApplication.status === 'approved') return { icon: CheckCircle, text: 'Approved! Welcome to Pro League', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
    if (myApplication.status === 'rejected') return { icon: XCircle, text: 'Application Declined', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' };
    return null;
  };

  const appStatus = getApplicationStatus();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl text-gold mb-1">LEAGUE</h1>
          <p className="text-xs text-muted-foreground">
            Your league determines event access, Index multipliers, and competitive tier.
          </p>
        </motion.div>
      </div>

      {/* Current League Banner */}
      {!loading && profile && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-4 mb-6"
        >
          {(() => {
            const league = leagues.find(l => l.id === currentLeague) || leagues[2];
            return (
              <div className={`relative overflow-hidden bg-gradient-to-br ${league.bg} border-l-4 ${league.border} p-5`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-1">Your League</p>
                    <h2 className={`font-display text-3xl ${league.color}`}>{league.name}</h2>
                    <p className="text-xs text-muted-foreground mt-1">{league.subtitle}</p>
                  </div>
                  <league.icon className={`w-12 h-12 ${league.color} opacity-30`} />
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
                  <div className="text-center">
                    <p className="font-display text-xl">{totalWins}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Wins</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display text-xl">{profile.total_events || 0}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Events</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display text-xl">{profile.global_index_score || 0}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Index</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </motion.div>
      )}

      {/* Pro League Application */}
      {currentLeague === 'open' && !loading && profile && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mx-4 mb-6"
        >
          <div className="bg-surface-1 border border-border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-display text-lg text-emerald-400">Path to Pro</h3>
                <p className="text-[10px] text-muted-foreground">Win events to unlock Pro League</p>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Arena Wins</span>
                <span className={meetsProRequirement ? 'text-emerald-400 font-bold' : 'text-foreground'}>{totalWins} / 2</span>
              </div>
              <div className="h-2 bg-surface-0 border border-border overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((totalWins / 2) * 100, 100)}%` }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="h-full bg-gradient-to-r from-emerald-500/50 to-emerald-400"
                />
              </div>
            </div>

            {/* Application status or button */}
            {appStatus ? (
              <div className={`flex items-center gap-2 p-3 border ${appStatus.bg} rounded-sm`}>
                <appStatus.icon className={`w-4 h-4 ${appStatus.color}`} />
                <span className={`text-sm font-medium ${appStatus.color}`}>{appStatus.text}</span>
              </div>
            ) : meetsProRequirement ? (
              <Button
                onClick={applyForProLeague}
                className="w-full bg-emerald-500 text-white hover:bg-emerald-600 font-display"
              >
                <Zap className="w-4 h-4 mr-2" />
                Apply for Pro League
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-2">
                Win {2 - totalWins} more event{2 - totalWins !== 1 ? 's' : ''} to unlock the application
              </p>
            )}

            {myApplication?.status === 'rejected' && myApplication.admin_notes && (
              <p className="text-xs text-muted-foreground mt-2 p-2 bg-surface-0 border border-border">
                <span className="text-red-400 font-semibold">Note:</span> {myApplication.admin_notes}
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* League Cards */}
      <div className="px-4 space-y-4">
        <h3 className="font-display text-sm text-muted-foreground uppercase tracking-widest">All Leagues</h3>

        {leagues.map((league, index) => {
          const isCurrent = currentLeague === league.id;
          const isLocked = league.id === 'elite' || (league.id === 'pro' && currentLeague === 'open');

          return (
            <motion.div
              key={league.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              className={`
                relative overflow-hidden bg-gradient-to-br ${league.bg}
                border-l-4 ${league.border}
                ${isCurrent ? 'ring-2 ring-gold/50' : ''}
                ${league.glow ? `shadow-lg ${league.glow}` : ''}
              `}
            >
              <div className="p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <league.icon className={`w-8 h-8 ${league.color}`} />
                    <div>
                      <h2 className={`font-display text-xl ${league.color}`}>{league.name}</h2>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{league.subtitle}</p>
                    </div>
                  </div>
                  {isCurrent && (
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-gold/20 text-gold px-2 py-1">
                      Current
                    </span>
                  )}
                  {isLocked && !isCurrent && (
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{league.description}</p>

                {/* Benefits */}
                <div className="space-y-1.5 mb-4">
                  {league.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <CheckCircle className={`w-3 h-3 ${league.color} flex-shrink-0`} />
                      <span className="text-muted-foreground">{benefit}</span>
                    </div>
                  ))}
                </div>

                {/* Requirement */}
                <div className="pt-3 border-t border-border/50">
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-1 border ${league.border} ${league.color} bg-surface-0`}>
                    {league.requirement}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* League Leaderboard */}
      <section className="px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-sm text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Trophy className="w-4 h-4 text-gold" />
              {currentLeague.toUpperCase()} LEAGUE — TOP EDITORS
            </h3>
            <button onClick={() => navigate('/rankings')} className="text-[10px] text-gold uppercase tracking-wider flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {rankings.length === 0 ? (
            <div className="bg-surface-1 border border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">No ranked editors yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {rankings.slice(0, 10).map((editor, idx) => (
                <button
                  key={editor.id}
                  onClick={() => navigate(`/editor/${editor.id}`)}
                  className={`w-full flex items-center gap-3 p-3 bg-surface-1 border border-border hover:border-gold/30 transition-colors text-left ${
                    editor.id === profile?.id ? 'ring-1 ring-gold/40' : ''
                  }`}
                >
                  <span className={`font-display text-lg w-8 text-center ${idx < 3 ? 'text-gold' : 'text-muted-foreground'}`}>
                    {idx + 1}
                  </span>
                  <div className="w-8 h-8 bg-surface-0 border border-border overflow-hidden flex-shrink-0">
                    {editor.avatar_url ? (
                      <img src={editor.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">?</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm truncate">{editor.username}</p>
                  </div>
                  <span className="font-display text-sm text-gold">{editor.global_index_score}</span>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </section>
    </div>
  );
}
