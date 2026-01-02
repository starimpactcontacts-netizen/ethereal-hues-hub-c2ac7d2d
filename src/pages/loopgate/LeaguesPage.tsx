import { Shield, Star, Crown, Lock } from "lucide-react";
import loopgateLogo from "@/assets/loopgate-logo.png";

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
    status: "Top 15% of Open",
    requirement: "Performance-based",
    locked: true,
    accent: "border-blue-500/50",
    iconColor: "text-blue-400",
  },
  {
    id: "elite",
    name: "Elite",
    icon: Crown,
    status: "Invite Only • 50 Max",
    requirement: "Capped roster",
    locked: true,
    accent: "border-gold",
    iconColor: "text-gold",
  },
];

export default function LeaguesPage() {
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
        {leagues.map((league, index) => (
          <div
            key={league.id}
            className={`bg-surface-1 border-l-4 ${league.accent} p-5 relative`}
          >
            {/* Lock Badge */}
            {league.locked && (
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
        ))}
      </div>

      {/* Current Status */}
      <section className="px-4 py-6">
        <div className="bg-surface-1 border-l-4 border-foreground/20 p-5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-2">
            Your League
          </p>
          <p className="font-display text-3xl">Open</p>
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Next tier</span>
            <span className="text-xs text-gold font-semibold">Top 15% → Pro</span>
          </div>
        </div>
      </section>
    </div>
  );
}
