import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Check, ArrowUpRight, DollarSign, Activity } from 'lucide-react';

interface Milestone { views: number; bonus_cents: number; }

const formatMoney = (cents: number) =>
  `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatViews = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
  return n.toLocaleString();
};

export default function ViewsGamePanel({ milestones }: { milestones: Milestone[] }) {
  const sorted = [...milestones].sort((a, b) => a.views - b.views);
  const maxViews = sorted[sorted.length - 1]?.views || 1;
  const totalPool = sorted.reduce((s, m) => s + m.bonus_cents, 0);

  const [demoViews, setDemoViews] = useState(0);
  const [tick, setTick] = useState(0);
  const [flash, setFlash] = useState(false);

  // Continuous "market" loop — climbs, micro-jitters, occasionally pops a milestone, resets
  useEffect(() => {
    if (!maxViews) return;
    let raf = 0;
    let last = performance.now();
    let v = 0;
    let velocity = maxViews / 8000; // base views per ms — full climb ~8s
    const loop = (t: number) => {
      const dt = t - last;
      last = t;
      // micro jitter for "live trading" feel
      const jitter = (Math.random() - 0.3) * velocity * dt * 0.4;
      v += velocity * dt + jitter;
      if (v >= maxViews * 1.05) {
        v = 0;
        setFlash(true);
        setTimeout(() => setFlash(false), 600);
      }
      setDemoViews(Math.max(0, Math.floor(v)));
      setTick((x) => (x + 1) % 1_000_000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [maxViews]);

  const pct = Math.min(100, (demoViews / maxViews) * 100);
  const nextIdx = sorted.findIndex((m) => demoViews < m.views);
  const next = nextIdx >= 0 ? sorted[nextIdx] : null;
  const cleared = nextIdx === -1 ? sorted.length : nextIdx;
  const earned = sorted.slice(0, cleared).reduce((s, m) => s + m.bonus_cents, 0);

  // Sparkline — fake last 24 ticks of "velocity" for that polymarket vibe
  const spark = Array.from({ length: 24 }, (_, i) => {
    const seed = (tick + i * 7) % 100;
    return 30 + Math.sin((tick + i) * 0.3) * 18 + (seed % 13);
  });
  const sparkMax = Math.max(...spark);
  const sparkMin = Math.min(...spark);
  const sparkPath = spark
    .map((y, i) => {
      const x = (i / (spark.length - 1)) * 100;
      const ny = 100 - ((y - sparkMin) / (sparkMax - sparkMin || 1)) * 100;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ny.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="mt-4 pt-4 border-t border-white/[0.06]">
      {/* Header — your position */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="inline-flex items-center gap-2">
          <Activity className="w-3 h-3 text-[#30D158]" strokeWidth={3} />
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white">YOUR POSITION</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8E8E93]">· VIEWS</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08]">
          <DollarSign className="w-2.5 h-2.5 text-[#30D158]" strokeWidth={3} />
          <span className="text-[10px] font-black tabular-nums text-white tracking-wide">
            {formatMoney(totalPool)} <span className="text-[#8E8E93]">MAX</span>
          </span>
        </div>
      </div>

      {/* MAIN TICKER — black trading terminal */}
      <div
        className="rounded-[14px] p-3.5 mb-3 relative overflow-hidden"
        style={{
          background: '#0a0a0a',
          border: `1px solid ${flash ? 'rgba(48,209,88,0.6)' : 'rgba(255,255,255,0.08)'}`,
          boxShadow: flash ? '0 0 30px rgba(48,209,88,0.4), inset 0 0 20px rgba(48,209,88,0.1)' : 'inset 0 0 20px rgba(0,0,0,0.5)',
          transition: 'all 0.3s',
        }}
      >
        {/* Grid bg — subtle terminal feel */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(48,209,88,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(48,209,88,0.5) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        <div className="relative flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 mb-1">
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#8E8E93]">CURRENT VIEWS</span>
              <span className="text-[9px] font-black uppercase tracking-[0.1em] text-[#30D158] tabular-nums inline-flex items-center gap-0.5">
                <ArrowUpRight className="w-2.5 h-2.5" strokeWidth={3} />
                +{((demoViews / maxViews) * 100).toFixed(2)}%
              </span>
            </div>
            <p className="font-mono text-[34px] font-black text-white leading-none tabular-nums tracking-tight" style={{ textShadow: '0 0 20px rgba(48,209,88,0.4)' }}>
              {formatViews(demoViews)}
            </p>
          </div>

          {/* Live sparkline */}
          <div className="w-[88px] h-[44px] shrink-0">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="sparkFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#30D158" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#30D158" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={`${sparkPath} L100,100 L0,100 Z`} fill="url(#sparkFill)" />
              <path d={sparkPath} fill="none" stroke="#30D158" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Earned + progress row */}
        <div className="relative mt-3 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[9px] font-black uppercase tracking-[0.12em] text-[#8E8E93]">UNREALIZED</span>
            <span className="font-mono text-[18px] font-black text-[#30D158] tabular-nums leading-none">
              {formatMoney(earned)}
            </span>
          </div>
          {next && (
            <div className="text-right">
              <div className="text-[9px] font-black uppercase tracking-[0.12em] text-[#8E8E93] inline-flex items-center gap-1">
                NEXT FILL
              </div>
              <div className="font-mono text-[12px] font-bold text-white tabular-nums">
                {formatViews(next.views - demoViews)} → <span className="text-[#30D158]">+{formatMoney(next.bonus_cents)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Progress bar — segmented like a tycoon meter */}
        <div className="relative mt-2.5">
          <div className="h-[6px] rounded-full bg-white/[0.06] overflow-hidden relative">
            <motion.div
              className="h-full"
              style={{
                background: 'linear-gradient(90deg, #30D158 0%, #FFD60A 60%, #FF9F0A 100%)',
                boxShadow: '0 0 10px rgba(48,209,88,0.6)',
              }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.15, ease: 'linear' }}
            />
            {/* shine sweep */}
            <motion.div
              className="absolute top-0 h-full w-8 pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}
              animate={{ left: ['-10%', '110%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          </div>
          {sorted.map((m, i) => {
            const left = (m.views / maxViews) * 100;
            const isCleared = demoViews >= m.views;
            return (
              <div
                key={i}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[10px] h-[10px] rotate-45 transition-all"
                style={{
                  left: `${left}%`,
                  background: isCleared ? '#FFD60A' : '#0a0a0a',
                  border: `1.5px solid ${isCleared ? '#FFD60A' : 'rgba(255,255,255,0.25)'}`,
                  boxShadow: isCleared ? '0 0 10px rgba(255,214,10,0.8)' : 'none',
                }}
              />
            );
          })}
        </div>
      </div>

      {/* TIER ROWS — polymarket-style odds rows */}
      <div className="space-y-1">
        {sorted.map((m, i) => {
          const isCleared = demoViews >= m.views;
          const isNext = !isCleared && i === nextIdx;
          const tierPct = Math.min(100, (demoViews / m.views) * 100);
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="relative overflow-hidden rounded-[10px] px-3 py-2 transition-all"
              style={{
                background: '#101012',
                border: `1px solid ${
                  isCleared ? 'rgba(48,209,88,0.35)' : isNext ? 'rgba(255,159,10,0.4)' : 'rgba(255,255,255,0.05)'
                }`,
              }}
            >
              {/* fill bar behind row — polymarket style */}
              <div
                className="absolute inset-y-0 left-0 transition-all"
                style={{
                  width: `${tierPct}%`,
                  background: isCleared
                    ? 'linear-gradient(90deg, rgba(48,209,88,0.18), rgba(48,209,88,0.06))'
                    : isNext
                      ? 'linear-gradient(90deg, rgba(255,159,10,0.22), rgba(255,159,10,0.04))'
                      : 'rgba(255,255,255,0.02)',
                }}
              />
              <div className="relative flex items-center gap-2.5">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                  style={{
                    background: isCleared ? '#30D158' : isNext ? 'rgba(255,159,10,0.2)' : 'rgba(255,255,255,0.05)',
                  }}
                >
                  {isCleared ? (
                    <Zap className="w-3.5 h-3.5 text-black" strokeWidth={3} fill="black" />
                  ) : isNext ? (
                    <Flame className="w-3.5 h-3.5 text-[#FF9F0A]" strokeWidth={2.8} />
                  ) : (
                    <Lock className="w-3 h-3 text-[#48484A]" strokeWidth={2.8} />
                  )}
                </div>
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <p
                    className={`font-mono text-[13px] font-black tabular-nums ${
                      isCleared ? 'text-white' : isNext ? 'text-white' : 'text-[#6B6B70]'
                    }`}
                  >
                    {formatViews(m.views)}
                  </p>
                  <span
                    className={`text-[9px] font-black uppercase tracking-[0.1em] tabular-nums ${
                      isCleared ? 'text-[#30D158]' : isNext ? 'text-[#FF9F0A]' : 'text-[#48484A]'
                    }`}
                  >
                    {isCleared ? 'HIT' : `${tierPct.toFixed(0)}%`}
                  </span>
                </div>
                <p
                  className="font-mono text-[15px] font-black tabular-nums leading-none"
                  style={{ color: isCleared ? '#30D158' : isNext ? '#FF9F0A' : '#48484A' }}
                >
                  +{formatMoney(m.bonus_cents)}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-center gap-1.5 px-3 py-2 rounded-[10px] bg-[#30D158]/8 border border-[#30D158]/20">
        <TrendingUp className="w-3 h-3 text-[#30D158]" strokeWidth={2.8} />
        <span className="text-[10px] font-black uppercase tracking-[0.1em] text-[#30D158]">
          Hit a tier → instant cashout
        </span>
      </div>
    </div>
  );
}