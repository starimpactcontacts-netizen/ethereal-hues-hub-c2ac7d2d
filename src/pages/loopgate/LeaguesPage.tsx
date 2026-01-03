import { Shield, Star, Crown, Lock, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRealRankings } from "@/hooks/useRealData";
import loopgateLogo from "@/assets/loopgate-logo-white.png";

const leagues = [
  {
    id: "open",
    name: "Open",
    icon: Shield,
    status: "Open to all",
    requirement: "Anyone can compete",
    locked: false,
    accent: "border-foreground/20",
    iconColor: "text-foreground",
  },
  {
    id: "pro",
    name: "Pro",
    icon: Star,
    status: "Top 15% + 1 Win",
    requirement: "Performance-based promotion",
    locked: true,
    accent: "border-blue-500/50",
    iconColor: "text-blue-400",
  },
  {
    id: "elite",
    name: "Elite",
    icon: Crown,
    status: "Top 1%",
    requirement: "Reserved for the best",
    locked: true,
    accent: "border-gold",
    iconColor: "text-gold",
  },
];

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
    ? ((userRank / totalUsers) * 100).toFixed(1)
    : null;

  const userLeague = profile?.league || 'open';

  // Calculate what's needed for next tier
  const getNextTierInfo = () => {
    if (userLeague === 'elite') return null;
    if (userLeague === 'pro') return { tier: 'Elite', requirement: 'Top 1% ranking' };
    return { tier: 'Pro', requirement: 'Top 15% + 1 event win' };
  };

  const nextTier = getNextTierInfo();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <img src={loopgateLogo} alt="LOOPGATE" className="h-6" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
            Leagues
          </span>
        </div>
      </header>

      {/* League Hierarchy */}
      <div className="p-4 space-y-3">
        {leagues.map((league, index) => {
          const isCurrentLeague = userLeague === league.id;
          
          return (
            <div
              key={league.id}
              className={`bg-surface-1 border-l-4 ${league.accent} p-5 relative ${isCurrentLeague ? 'ring-1 ring-gold/50' : ''}`}
            >
              {/* Current Badge */}
              {isCurrentLeague && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 text-gold">
                  <span className="text-[10px] uppercase tracking-wider font-semibold">Your League</span>
                </div>
              )}

              {/* Lock Badge */}
              {league.locked && !isCurrentLeague && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 text-muted-foreground">
                  <Lock size={12} />
                  <span className="text-[10px] uppercase tracking-wider">Locked</span>
                </div>
              )}

              {/* Icon + Name */}
              <div className="flex items-center gap-3 mb-3">
                <league.icon size={24} className={league.iconColor} strokeWidth={2} />
                <h2 className="font-display text-3xl">{league.name}</h2>
              </div>

              {/* Status */}
              <p className={`text-sm font-semibold ${league.id === "elite" ? "text-gold" : league.id === "pro" ? "text-blue-400" : "text-green-500"}`}>
                {league.status}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {league.requirement}
              </p>

              {/* Tier Indicator */}
              <div className="mt-4 pt-4 border-t border-border/50">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Tier {leagues.length - index}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Current Status */}
      <section className="px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : profile ? (
          <div className={`bg-surface-1 border-l-4 ${
            userLeague === 'elite' ? 'border-gold' : 
            userLeague === 'pro' ? 'border-blue-500/50' : 
            'border-foreground/20'
          } p-5`}>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-2">
              Your Status
            </p>
            <p className="font-display text-3xl capitalize">{userLeague}</p>
            
            {userRank && totalUsers > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Rank #{userRank} of {totalUsers} • Top {userPercentile}%
              </p>
            )}

            {nextTier && (
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Next tier</span>
                <span className="text-xs text-gold font-semibold">
                  {nextTier.requirement} → {nextTier.tier}
                </span>
              </div>
            )}

            {!nextTier && (
              <div className="mt-4 pt-4 border-t border-border">
                <span className="text-xs text-gold font-semibold">Maximum tier reached</span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-surface-1 border-l-4 border-foreground/20 p-5">
            <p className="text-sm text-muted-foreground">
              Sign up to track your league progression
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
