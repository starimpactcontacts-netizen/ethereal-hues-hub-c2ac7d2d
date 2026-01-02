import { Lock, Crown, Trophy } from "lucide-react";
import loopgateLogo from "@/assets/loopgate-logo.png";

export default function ChampionshipPage() {
  const championshipDate = new Date("2026-12-01");
  const now = new Date();
  const monthsAway = Math.ceil(
    (championshipDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <img src={loopgateLogo} alt="LOOPGATE" className="h-6" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
            Finals
          </span>
        </div>
      </header>

      {/* Ceremonial Hero */}
      <div className="p-4 pt-12">
        <div className="text-center">
          {/* Crown Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border border-gold/30 mb-8">
            <Crown size={48} strokeWidth={1} className="text-gold" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-black tracking-tight">
            LOOPGATE
          </h1>
          <h2 className="text-2xl font-black tracking-tight text-gold">
            GLOBAL CHAMPIONSHIP
          </h2>
          
          <p className="text-sm text-muted-foreground mt-4 max-w-[280px] mx-auto">
            The ultimate proving ground for elite editors.
          </p>
        </div>

        {/* Countdown */}
        <div className="mt-12 bg-surface-1 border border-border rounded-lg p-8 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-4">
            Countdown
          </p>
          <p className="text-6xl font-black text-gold">{monthsAway}</p>
          <p className="text-sm text-muted-foreground mt-2">Months Away</p>
        </div>

        {/* Lock Status */}
        <div className="mt-8 flex items-center justify-center gap-2 text-muted-foreground">
          <Lock size={14} />
          <span className="text-xs">Details locked until qualification</span>
        </div>
      </div>

      {/* Requirements */}
      <section className="px-4 py-8 mt-8 border-t border-border">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">
          Qualification Requirements
        </h3>
        <div className="space-y-3">
          <div className="bg-surface-1 border border-border rounded-lg p-4 flex items-center gap-4">
            <Trophy size={18} className="text-gold flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold">Top 100 Global Rank</p>
              <p className="text-[10px] text-muted-foreground">Minimum threshold</p>
            </div>
          </div>
          <div className="bg-surface-1 border border-border rounded-lg p-4 flex items-center gap-4">
            <Crown size={18} className="text-gold flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold">3+ Event Finals</p>
              <p className="text-[10px] text-muted-foreground">Proven consistency</p>
            </div>
          </div>
          <div className="bg-surface-1 border border-border rounded-lg p-4 flex items-center gap-4 opacity-40">
            <Lock size={18} className="flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold">Additional criteria</p>
              <p className="text-[10px] text-muted-foreground">To be announced</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sponsor Slot */}
      <section className="px-4 pb-8">
        <div className="border border-dashed border-border rounded-lg p-8 text-center">
          <Lock size={18} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
            Sponsor Slot Reserved
          </p>
        </div>
      </section>

      {/* Quote */}
      <section className="px-4 py-12 text-center border-t border-border">
        <p className="text-lg font-medium italic text-muted-foreground">
          "This is where legends are made."
        </p>
      </section>
    </div>
  );
}
