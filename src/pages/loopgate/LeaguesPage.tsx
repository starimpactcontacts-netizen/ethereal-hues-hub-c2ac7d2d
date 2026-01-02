import { Shield, Star, Crown, Lock } from "lucide-react";

const leagues = [
  {
    id: "open",
    name: "Open League",
    icon: Shield,
    description: "Anyone can compete. Entry-level competitive tier.",
    status: "Open to all",
    color: "text-foreground",
    bgColor: "bg-card",
    borderColor: "border-border",
  },
  {
    id: "pro",
    name: "Pro League",
    icon: Star,
    description: "Top performers from Open. Performance-based qualification.",
    status: "Top 15% of Open",
    color: "text-blue-400",
    bgColor: "bg-blue-950/20",
    borderColor: "border-blue-900/50",
  },
  {
    id: "elite",
    name: "Elite League",
    icon: Crown,
    description: "Invite-only. Capped roster. The apex tier.",
    status: "Invite Only",
    color: "text-gold",
    bgColor: "bg-gold/5",
    borderColor: "border-gold/30",
  },
];

export default function LeaguesPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-4">
          <h1 className="text-lg font-bold tracking-tight">LEAGUES</h1>
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest mt-0.5">
            Competitive Brackets
          </p>
        </div>
      </header>

      {/* League Cards */}
      <div className="px-4 py-6 space-y-4">
        {leagues.map((league) => (
          <div
            key={league.id}
            className={`${league.bgColor} border ${league.borderColor} rounded-lg p-6`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg bg-surface-2 ${league.color}`}>
                <league.icon size={24} />
              </div>
              <div className="flex-1">
                <h2 className={`text-lg font-bold ${league.color}`}>
                  {league.name}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {league.description}
                </p>
                <div className="mt-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-2 rounded-full text-xs font-medium">
                    {league.id === "elite" && <Lock size={12} />}
                    {league.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Section */}
      <section className="px-4 py-6 border-t border-border">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          League System
        </h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>Leagues prevent dominance fatigue.</p>
          <p>Movement between leagues is performance-based.</p>
          <p>Elite League roster is capped at 50 editors.</p>
          <p>Each league has dedicated activations.</p>
        </div>
      </section>

      {/* Current Status */}
      <section className="px-4 py-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
            Your League
          </p>
          <p className="text-xl font-bold">Open League</p>
          <p className="text-sm text-muted-foreground mt-1">
            Compete in Open activations to advance.
          </p>
        </div>
      </section>
    </div>
  );
}
