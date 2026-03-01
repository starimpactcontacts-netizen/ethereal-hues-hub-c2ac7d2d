import { Home, Swords, Search, User, Zap, Shield, Target, ChevronRight, Play, Eye } from 'lucide-react';
import loopgateBrand from '@/assets/loopgate-brand.png';
import loopgateLogo from '@/assets/loopgate-logo.png';

/**
 * Code-built mockup matching the REAL Loopgate Hub screen.
 * References: IMG_5925 (Hub), IMG_5922 (Arena), IMG_5923 (Index).
 */
export default function LandingAppMockup() {
  return (
    <div className="w-full bg-background text-foreground overflow-hidden select-none pointer-events-none" style={{ fontSize: '11px' }}>
      {/* ── Top Header Bar ── */}
      <div className="h-9 bg-background border-b border-border/30 flex items-center justify-between px-3">
        <img src={loopgateBrand} alt="" className="h-4 w-auto opacity-90" />
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-full bg-surface-2 flex items-center justify-center">
            <span className="text-[7px] text-muted-foreground">💬</span>
          </div>
          <div className="w-5 h-5 rounded-full bg-surface-2 flex items-center justify-center">
            <span className="text-[7px] text-muted-foreground">✈</span>
          </div>
          <div className="relative w-5 h-5 rounded-full bg-surface-2 flex items-center justify-center">
            <span className="text-[7px] text-muted-foreground">🔔</span>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full text-[5px] text-white flex items-center justify-center font-bold">1</span>
          </div>
          <div className="w-4 h-3 flex flex-col gap-[1.5px] justify-center">
            <div className="h-[1.5px] bg-foreground/60 w-full" />
            <div className="h-[1.5px] bg-foreground/60 w-3/4" />
            <div className="h-[1.5px] bg-foreground/60 w-full" />
          </div>
        </div>
      </div>

      {/* ── Main Content Area (Hub Screen) ── */}
      <div className="px-3 pt-3 pb-1 space-y-2.5" style={{ height: '360px', overflow: 'hidden' }}>

        {/* User Card */}
        <div className="bg-surface-1 border border-border/40 p-3">
          <div className="flex items-center gap-2.5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-full bg-surface-2 border border-border/50 flex items-center justify-center overflow-hidden">
                <span className="text-lg">🎮</span>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 bg-surface-2 border border-border/40 text-[7px] font-bold text-foreground px-1 py-[1px] rounded-sm">LV 2</span>
            </div>
            {/* Name & tags */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-base text-foreground leading-none">AUREN</span>
                <span className="text-[8px] bg-surface-2 border border-border/40 px-1.5 py-[1px] text-muted-foreground font-bold">✏ F</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[8px] bg-surface-2 border border-border/40 px-1.5 py-[1px] text-muted-foreground">👥 OPEN</span>
                <span className="text-[8px] bg-surface-2 border border-border/40 px-1.5 py-[1px] text-gold font-bold">🏆 #84</span>
              </div>
            </div>
            {/* Index pill */}
            <div className="bg-surface-2 border border-border/40 px-2.5 py-1.5 flex items-center gap-1.5">
              <span className="text-[9px] font-bold text-foreground">⚙ 0</span>
              <span className="text-[8px] text-emerald-400 font-bold">$</span>
              <span className="text-[8px] text-gold font-bold tracking-wider uppercase">INDEX</span>
            </div>
          </div>
          {/* XP bar */}
          <div className="mt-2.5 flex items-center justify-between text-[8px] text-muted-foreground mb-1">
            <span>XP: 105 / 300</span>
            <span>→ Level 3</span>
          </div>
          <div className="w-full h-1 bg-surface-2 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full" style={{ width: '35%' }} />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { val: '0', label: 'EVENTS' },
            { val: '0', label: 'WINS' },
            { val: '—', label: 'BEST QOI' },
            { val: '—', label: 'WIN RATE' },
          ].map(s => (
            <div key={s.label} className="bg-surface-1 border border-border/30 py-2 text-center">
              <div className="font-display text-sm text-foreground leading-none">{s.val}</div>
              <div className="text-[7px] text-muted-foreground mt-0.5 tracking-wider uppercase">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick action cards */}
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { icon: '✏', label: 'PANEL', sub: 'START JUDGING', color: 'text-red-400', border: 'border-red-500/20 bg-red-500/5' },
            { icon: '🛡', label: 'YOUR UNIT', sub: "XR'S ARENA", color: 'text-foreground', border: 'border-border/30 bg-surface-1' },
            { icon: '◎', label: 'GQT', sub: 'GET YOUR SCORE', color: 'text-foreground', border: 'border-border/30 bg-surface-1' },
          ].map(c => (
            <div key={c.label} className={`${c.border} border p-2.5`}>
              <div className="text-base mb-1">{c.icon}</div>
              <div className={`text-[8px] font-bold tracking-wider uppercase ${c.color}`}>{c.label}</div>
              <div className="text-[8px] text-muted-foreground font-semibold uppercase mt-0.5">{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Live battle alert */}
        <div className="border border-red-500/30 bg-red-500/5 p-2.5 flex items-center gap-2.5">
          <div className="w-7 h-7 bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
            <Swords className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[9px] font-bold text-foreground uppercase">LIVE — 🛡 YOU'RE DEFENDING</span>
              <span className="text-[7px] bg-gold/20 text-gold px-1 py-[1px] font-bold">RAPID</span>
            </div>
            <div className="text-[8px] text-muted-foreground mt-0.5">aimerson226 vs auren</div>
          </div>
          <span className="text-[8px] text-muted-foreground">Ended ›</span>
        </div>

        {/* Quick Edit Battle CTA */}
        <div className="bg-red-500 py-3 flex items-center justify-center gap-2">
          <Zap className="w-4 h-4 text-white" />
          <span className="font-display text-base text-white tracking-wider uppercase">QUICK EDIT BATTLE</span>
          <span className="text-[9px] text-white/70 ml-1">+20 IDX</span>
        </div>

        {/* Arena entry */}
        <div className="bg-surface-1 border border-border/30 p-2.5 flex items-center gap-2.5">
          <div className="w-8 h-8 bg-background border border-border/40 flex items-center justify-center">
            <img src={loopgateLogo} alt="" className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <span className="font-display text-sm text-foreground">ARENA</span>
            <div className="text-[8px] text-muted-foreground">Enter editing battles</div>
          </div>
          <span className="text-[9px] text-gold font-bold tracking-wider">ENTER →</span>
        </div>

        {/* Featured row */}
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[9px] font-bold text-foreground uppercase tracking-wider">FEATURED</span>
          <span className="text-[8px] text-muted-foreground">(14 active)</span>
          <span className="ml-auto text-[8px] text-muted-foreground">VIEW ALL →</span>
        </div>
        <div className="flex gap-1.5">
          {['BLXDE', 'Freddz808'].map(name => (
            <div key={name} className="flex-1 h-10 bg-gradient-to-r from-purple-900/40 to-red-900/30 border border-border/30 flex items-center px-2 gap-1.5">
              <div className="w-4 h-4 rounded-full bg-surface-2 shrink-0" />
              <span className="text-[8px] font-bold text-foreground truncate">{name}</span>
              {name === 'BLXDE' && <span className="text-[6px] bg-emerald-500/20 text-emerald-400 px-1 font-bold ml-auto">LIVE</span>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom Nav ── */}
      <div className="h-12 bg-background border-t border-border/40 flex items-center justify-around px-2">
        {[
          { icon: Home, label: 'Hub', active: true },
          { icon: Swords, label: 'Loop', active: false },
          { logo: true, label: '' },
          { icon: Search, label: 'Discover', active: false },
          { icon: User, label: 'Profile', active: false },
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            {item.logo ? (
              <div className="w-10 h-10 -mt-4 bg-foreground rounded-full flex items-center justify-center shadow-lg">
                <img src={loopgateLogo} alt="" className="w-5 h-5 invert" />
              </div>
            ) : (
              <>
                <item.icon className={`w-4 h-4 ${item.active ? 'text-foreground' : 'text-muted-foreground'}`} />
                <span className={`text-[8px] ${item.active ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>{item.label}</span>
              </>
            )}
          </div>
        ))}
      </div>
      {/* Red dot center indicator */}
      <div className="flex justify-center -mt-0.5 mb-1">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
      </div>
    </div>
  );
}
