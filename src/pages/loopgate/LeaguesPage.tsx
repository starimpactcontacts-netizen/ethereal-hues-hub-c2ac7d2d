import { Lock } from "lucide-react";
import loopgateLogo from "@/assets/loopgate-logo.png";

const leagues = [
  {
    id: "open",
    name: "Open",
    tagline: "Anyone can compete",
    description: "Entry-level competitive tier. Build your index here.",
    status: "Open to all",
    locked: false,
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Performance-based entry",
    description: "Reserved for top performers from Open League.",
    status: "Top 15%",
    locked: false,
  },
  {
    id: "elite",
    name: "Elite",
    tagline: "The apex tier",
    description: "Invite-only. Capped roster of 50 editors. The final level.",
    status: "Invite Only",
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
        {leagues.map((league, index) => (
          <div
            key={league.id}
            className={`rounded-lg p-6 ${
              league.id === "elite"
                ? "bg-surface-1 border border-gold/20"
                : "bg-surface-1 border border-border"
            }`}
          >
            {/* League Level Indicator */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                Tier {index + 1}
              </span>
              {league.locked && (
                <Lock size={14} className="text-gold" />
              )}
            </div>

            {/* League Name */}
            <h2 className={`text-2xl font-black tracking-tight ${
              league.id === "elite" ? "text-gold" : ""
            }`}>
              {league.name}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {league.tagline}
            </p>

            {/* Description */}
            <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
              {league.description}
            </p>

            {/* Status Badge */}
            <div className="mt-6">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                league.id === "elite"
                  ? "bg-gold/10 text-gold border border-gold/20"
                  : "bg-surface-2 text-muted-foreground"
              }`}>
                {league.locked && <Lock size={10} />}
                {league.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* System Info */}
      <section className="px-4 py-8 border-t border-border">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">
          League System
        </h3>
        <div className="space-y-2 text-xs text-muted-foreground">
          <p>• Leagues prevent dominance fatigue</p>
          <p>• Movement is performance-based</p>
          <p>• Elite roster capped at 50</p>
        </div>
      </section>

      {/* Your Status */}
      <section className="px-4 pb-8">
        <div className="bg-surface-1 border border-border rounded-lg p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-2">
            Your League
          </p>
          <p className="text-xl font-bold">Open</p>
        </div>
      </section>
    </div>
  );
}
