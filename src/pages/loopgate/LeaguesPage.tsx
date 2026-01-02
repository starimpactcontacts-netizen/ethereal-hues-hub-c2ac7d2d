import { Shield, Star, Crown, Lock, ChevronRight } from "lucide-react";
import loopgateLogo from "@/assets/loopgate-logo.png";

const leagues = [
  {
    id: "open",
    name: "Open League",
    icon: Shield,
    description: "Anyone can compete. Entry-level competitive tier.",
    status: "Open to all",
    statusColor: "text-green-500",
    color: "text-foreground",
    bgColor: "bg-surface-1",
    borderColor: "border-border",
    cta: "Open to all",
    locked: false,
  },
  {
    id: "pro",
    name: "Pro League",
    icon: Star,
    description: "Top 15% from Open League. Performance-based qualification.",
    status: "Top 15% of Open",
    statusColor: "text-blue-400",
    color: "text-blue-400",
    bgColor: "bg-blue-950/20",
    borderColor: "border-blue-900/40",
    cta: "Performance-based",
    locked: true,
  },
  {
    id: "elite",
    name: "Elite League",
    icon: Crown,
    description: "Invite-only. Capped roster of 50. The apex tier.",
    status: "Invite Only • 50 Roster",
    statusColor: "text-gold",
    color: "text-gold",
    bgColor: "bg-gold/5",
    borderColor: "border-gold/30",
    cta: "Invite Only",
    locked: true,
  },
];

export default function LeaguesPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <img src={loopgateLogo} alt="LOOPGATE" className="h-6" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
            Leagues
          </span>
        </div>
      </header>

      {/* League Cards */}
      <div className="p-4 space-y-4">
        {leagues.map((league) => (
          <div
            key={league.id}
            className={`${league.bgColor} border ${league.borderColor} rounded-xl p-5 relative overflow-hidden`}
          >
            {/* Background decoration for Elite */}
            {league.id === "elite" && (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,hsl(43_74%_49%/0.1),transparent_50%)]" />
            )}

            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-background/50 ${league.color}`}>
                  <league.icon size={28} strokeWidth={2} />
                </div>
                {league.locked && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-background/30 rounded-full text-[10px] text-muted-foreground">
                    <Lock size={10} />
                    <span>Locked</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <h2 className={`text-xl font-black ${league.color}`}>
                {league.name}
              </h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {league.description}
              </p>

              {/* Status Badge */}
              <div className="mt-4">
                <span className={`inline-flex items-center px-3 py-1.5 bg-background/50 rounded-lg text-xs font-semibold ${league.statusColor}`}>
                  {league.status}
                </span>
              </div>

              {/* CTA */}
              <div className="mt-4 flex items-center justify-between pt-4 border-t border-border/50">
                <span className="text-[10px] text-muted-foreground uppercase tracking-[0.15em]">
                  {league.cta}
                </span>
                {!league.locked && (
                  <ChevronRight size={16} className="text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Aspirational Quote */}
      <section className="px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground italic">
          "Climb the ranks. Prove your craft. Join the elite."
        </p>
      </section>

      {/* Current Status */}
      <section className="px-4 pb-6">
        <div className="bg-surface-1 border border-border rounded-xl p-5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-2">
            Your League
          </p>
          <p className="text-xl font-black">Open League</p>
          <p className="text-sm text-muted-foreground mt-1">
            Compete in Open activations to advance.
          </p>
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-[0.15em]">
              Next: Pro League
            </span>
            <span className="text-xs text-gold font-semibold">Top 15% required</span>
          </div>
        </div>
      </section>
    </div>
  );
}
