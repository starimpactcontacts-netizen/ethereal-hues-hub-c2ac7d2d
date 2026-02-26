import { Shield, Swords, Trophy, Crown, MessageCircle, Users, Home, Gamepad2, Award, BarChart3, Store } from 'lucide-react';
import loopgateBrand from '@/assets/loopgate-brand.png';

/**
 * Code-built mockup of the real Loopgate in-app UI.
 * No generated images — pure HTML/CSS matching the actual app.
 */
export default function LandingAppMockup() {
  return (
    <div className="w-full bg-background text-foreground overflow-hidden select-none pointer-events-none" style={{ fontSize: '11px' }}>
      {/* Top bar */}
      <div className="h-8 bg-surface-1 border-b border-border/40 flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <img src={loopgateBrand} alt="" className="h-4 w-auto" />
          <div className="flex items-center gap-1.5 ml-2">
            <div className="w-5 h-5 rounded-full bg-surface-2" />
            <div className="w-5 h-5 rounded-full bg-surface-2" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[9px] text-emerald-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            142 online
          </div>
          <div className="w-6 h-6 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center">
            <span className="text-[8px] text-gold font-bold">S</span>
          </div>
        </div>
      </div>

      <div className="flex" style={{ height: '340px' }}>
        {/* Sidebar */}
        <div className="w-12 bg-surface-0 border-r border-border/30 flex flex-col items-center py-2 gap-1.5 shrink-0">
          {[
            { icon: Home, active: true },
            { icon: Swords, active: false },
            { icon: Trophy, active: false },
            { icon: Shield, active: false },
            { icon: Users, active: false },
            { icon: MessageCircle, active: false },
            { icon: Store, active: false },
            { icon: BarChart3, active: false },
          ].map((item, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                item.active ? 'bg-gold/15 text-gold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Featured Battle Banner */}
          <div className="relative bg-gradient-to-r from-red-950/60 via-red-900/30 to-red-950/60 border-b border-red-800/30 px-4 py-4">
            <div className="text-center mb-2">
              <span className="text-[10px] font-bold tracking-[0.2em] text-red-400/80 uppercase">Featured</span>
              <h3 className="text-lg font-bold tracking-wide" style={{ fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                <span className="text-foreground">FEATURED </span>
                <span className="text-red-500">BATTLE</span>
              </h3>
              <span className="text-[9px] text-muted-foreground">Subtitle: Ed der Editor</span>
            </div>

            <div className="flex items-center justify-center gap-3">
              {/* Player 1 */}
              <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded bg-gradient-to-br from-amber-900/60 to-red-900/40 border border-gold/30 flex items-center justify-center">
                  <Gamepad2 className="w-5 h-5 text-gold/70" />
                </div>
                <span className="text-[10px] font-bold text-foreground">FLOUST</span>
                <span className="text-[8px] text-muted-foreground">Editroce Patron</span>
              </div>

              {/* VS */}
              <div className="flex flex-col items-center">
                <span className="font-display text-2xl font-bold text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">VS</span>
              </div>

              {/* Player 2 */}
              <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded bg-gradient-to-br from-slate-800/60 to-blue-900/40 border border-border/40 flex items-center justify-center">
                  <Gamepad2 className="w-5 h-5 text-blue-400/70" />
                </div>
                <span className="text-[10px] font-bold text-foreground">NOYTDS</span>
                <span className="text-[8px] text-muted-foreground">Editroce Iroldey</span>
              </div>
            </div>
          </div>

          {/* Global Leaderboard */}
          <div className="flex-1 px-3 py-2 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-display text-sm font-bold tracking-wide uppercase">Global Leaderboard</h4>
              <span className="text-[9px] text-muted-foreground">▾</span>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-[24px_1fr_48px_36px_36px_36px_48px] gap-1 text-[8px] text-muted-foreground font-bold tracking-wider uppercase mb-1 px-1">
              <span>#</span>
              <span>Global Leaderboard</span>
              <span className="text-center">Prions</span>
              <span className="text-center">Fmx</span>
              <span className="text-center">Tizes</span>
              <span className="text-center">Wbrs</span>
              <span className="text-center">Live</span>
            </div>

            {/* Leaderboard rows */}
            {[
              { rank: 1, name: 'cookaryl Sani', prions: 32, fmx: 3, tizes: 49, wbrs: 186, color: 'text-gold' },
              { rank: 2, name: 'Rlusiacly Llue', prions: 22, fmx: 4, tizes: 33, wbrs: 36, color: 'text-foreground' },
              { rank: 3, name: 'ClorolYosde', prions: 23, fmx: 4, tizes: 49, wbrs: 50, color: 'text-foreground' },
              { rank: 4, name: 'Queulkay New', prions: 29, fmx: 4, tizes: 35, wbrs: 78, color: 'text-foreground' },
              { rank: 5, name: 'Rluskaw Ielely', prions: 42, fmx: 4, tizes: 33, wbrs: 38, color: 'text-foreground' },
              { rank: 6, name: 'Elubteeniday', prions: 41, fmx: 4, tizes: 33, wbrs: 30, color: 'text-foreground' },
            ].map((row) => (
              <div
                key={row.rank}
                className="grid grid-cols-[24px_1fr_48px_36px_36px_36px_48px] gap-1 items-center py-1.5 px-1 border-b border-border/20 hover:bg-surface-1/50"
              >
                <span className={`font-bold ${row.rank <= 3 ? 'text-gold' : 'text-muted-foreground'}`}>{row.rank}</span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-5 h-5 rounded-full bg-surface-2 shrink-0" />
                  <span className="text-[10px] font-semibold text-foreground truncate">{row.name}</span>
                </div>
                <span className="text-center text-[10px] text-foreground">{row.prions}</span>
                <span className="text-center text-[10px] text-foreground">{row.fmx}</span>
                <span className="text-center text-[10px] text-foreground">{row.tizes}</span>
                <span className="text-center text-[10px] text-foreground">{row.wbrs}</span>
                <div className="flex items-center justify-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {row.rank <= 2 && <Trophy className="w-3 h-3 text-gold/60" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel - Live Activity */}
        <div className="w-36 bg-surface-0 border-l border-border/30 flex flex-col shrink-0 hidden sm:flex">
          <div className="px-2 py-2 border-b border-border/30">
            <span className="text-[9px] font-bold tracking-[0.15em] text-muted-foreground uppercase">Live Activity</span>
          </div>
          <div className="flex-1 overflow-hidden px-2 py-1.5 space-y-2">
            {[
              { user: 'zFlicks', action: 'won a battle', time: '2m' },
              { user: 'Nexora', action: 'submitted edit', time: '5m' },
              { user: 'VoidCuts', action: 'ranked up', time: '8m' },
              { user: 'Kaizenx', action: 'joined comp', time: '11m' },
              { user: 'StormEdits', action: 'won a battle', time: '14m' },
              { user: 'PhxEdits', action: 'new review', time: '18m' },
              { user: 'Eclipse', action: 'submitted', time: '22m' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <div className="w-4 h-4 rounded-full bg-surface-2 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-foreground block truncate">{item.user}</span>
                  <span className="text-[8px] text-muted-foreground block">{item.action} · {item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
