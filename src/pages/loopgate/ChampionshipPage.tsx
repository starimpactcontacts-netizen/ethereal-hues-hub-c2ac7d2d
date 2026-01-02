import { Lock, Crown, Calendar, Trophy } from "lucide-react";

export default function ChampionshipPage() {
  // Mock countdown - months away
  const championshipDate = new Date("2026-12-01");
  const now = new Date();
  const monthsAway = Math.ceil(
    (championshipDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-4">
          <h1 className="text-lg font-bold tracking-tight">CHAMPIONSHIP</h1>
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest mt-0.5">
            Annual Global Finals
          </p>
        </div>
      </header>

      {/* Locked Hero */}
      <div className="px-4 py-12">
        <div className="relative bg-gradient-to-br from-surface-2 via-surface-1 to-surface-2 border border-gold/20 rounded-xl p-8 text-center overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(43_74%_49%/0.1),transparent_50%)]" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gold/10 border border-gold/30 mb-6">
              <Crown size={40} className="text-gold" />
            </div>

            <h2 className="text-2xl font-bold mb-2">
              LOOPGATE GLOBAL CHAMPIONSHIP
            </h2>
            <p className="text-sm text-muted-foreground mb-8">
              The ultimate proving ground for elite editors.
            </p>

            {/* Countdown */}
            <div className="bg-surface-2 rounded-lg p-6 mb-6">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
                <Calendar size={14} className="inline mr-1" />
                Countdown
              </p>
              <p className="text-4xl font-bold text-gold">{monthsAway}</p>
              <p className="text-sm text-muted-foreground mt-1">Months Away</p>
            </div>

            {/* Lock indicator */}
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Lock size={16} />
              <span className="text-sm">Details locked until qualification period</span>
            </div>
          </div>
        </div>
      </div>

      {/* Requirements Preview */}
      <section className="px-4 py-6 border-t border-border">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Qualification Requirements
        </h3>
        <div className="space-y-3">
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center">
              <Trophy size={16} className="text-gold" />
            </div>
            <div>
              <p className="text-sm font-medium">Top 100 Global Rank</p>
              <p className="text-xs text-muted-foreground">Minimum threshold</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center">
              <Crown size={16} className="text-gold" />
            </div>
            <div>
              <p className="text-sm font-medium">3+ Event Finals</p>
              <p className="text-xs text-muted-foreground">Proven consistency</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3 opacity-50">
            <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center">
              <Lock size={16} />
            </div>
            <div>
              <p className="text-sm font-medium">Additional criteria</p>
              <p className="text-xs text-muted-foreground">To be announced</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sponsor Slot */}
      <section className="px-4 py-6">
        <div className="bg-surface-1 border border-dashed border-border rounded-lg p-8 text-center">
          <Lock size={24} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Sponsor Slot</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Reserved</p>
        </div>
      </section>

      {/* Quote */}
      <section className="px-4 py-12 text-center">
        <p className="text-lg font-medium italic text-muted-foreground">
          "This is where legends are made."
        </p>
      </section>
    </div>
  );
}
