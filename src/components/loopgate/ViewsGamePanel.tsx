import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Lock, Zap, Trophy, Flame, TrendingUp } from 'lucide-react';

interface Milestone { views: number; bonus_cents: number; }

const formatMoney = (cents: number) =>
  `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatViews = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
  return n.toLocaleString();
};

export default function ViewsGamePanel({ milestones }: { milestones: Milestone[] }) {
  // Demo "live ticker" — purely visual hype, simulates a clip climbing
  const sorted = [...milestones].sort((a, b) => a.views - b.views);
  const maxViews = sorted[sorted.length - 1]?.views || 1;
  const totalPool = sorted.reduce((s, m) => s + m.bonus_cents, 0);

  const [demoViews, setDemoViews] = useState(0);
  useEffect(() => {
    // Animate from 0 → first milestone over ~1.6s on mount, then idle
    const target = Math.min(maxViews, Math.floor(sorted[0]?.views * 0.35) || 0);
    let start: number | null = null;
    let raf = 0;
    const tick = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / 1600);
      setDemoViews(Math.floor(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [maxViews, sorted]);

  const pct = Math.min(100, (demoViews / maxViews) * 100);
  const nextIdx = sorted.findIndex((m) => demoViews < m.views);
  const next = nextIdx >= 0 ? sorted[nextIdx] : null;
  const cleared = nextIdx === -1 ? sorted.length : nextIdx;
  const earned = sorted.slice(0, cleared).reduce((s, m) => s + m.bonus_cents, 0);

  return (
    <div className="mt-4 pt-4 border-t border-white/[0.06]">
      {/* Header — Trading-view style */}
      <div className="flex items-center justify-between mb-3">
        <div className="inline-flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#FF453A] animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#FF453A]">Live</span>
          <span className="text-[11px] text-[#8E8E93] font-medium uppercase tracking-wide ml-1">Views</span>
        </div>
        <div className="inline-flex items-center gap-1 text-[10px] text-[#8E8E93] font-medium uppercase tracking-wide">
          <Trophy className="w-3 h-3 text-[#FFD60A]" />
          Pool {formatMoney(totalPool)}
        </div>
      </div>

      {/* Big counter — Roblox tycoon vibe */}
      <div className="rounded-[14px] p-3.5 mb-3 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(48,209,88,0.12) 0%, rgba(10,132,255,0.08) 100%)', border: '1px solid rgba(48,209,88,0.18)' }}>
        <div className="flex items-end justify-between">
          <div>
            <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#30D158]/80">
              <Eye className="w-3 h-3" /> Sample clip
            </div>
            <p className="font-apple-tight text-[28px] font-bold text-white leading-none mt-0.5 tabular-nums">
              {formatViews(demoViews)}
            </p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#FFD60A]">
              <Zap className="w-3 h-3" /> Earned
            </div>
            <p className="font-apple-tight text-[22px] font-bold text-[#30D158] leading-none mt-0.5 tabular-nums">
              {formatMoney(earned)}
            </p>
          </div>
        </div>

        {/* Progress bar with milestone notches */}
        <div className="relative mt-3">
          <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #30D158 0%, #FFD60A 100%)' }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
          {sorted.map((m, i) => {
            const left = (m.views / maxViews) * 100;
            const cleared = demoViews >= m.views;
            return (
              <div
                key={i}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 transition-all"
                style={{
                  left: `${left}%`,
                  background: cleared ? '#FFD60A' : '#1c1c1e',
                  borderColor: cleared ? '#FFD60A' : 'rgba(255,255,255,0.2)',
                  boxShadow: cleared ? '0 0 12px rgba(255,214,10,0.6)' : 'none',
                }}
              />
            );
          })}
        </div>

        {next && (
          <p className="text-[11px] text-white/70 mt-2 tabular-nums inline-flex items-center gap-1">
            <Flame className="w-3 h-3 text-[#FF9F0A]" />
            <span className="font-semibold text-white">{formatViews(next.views - demoViews)}</span>
            <span className="text-[#8E8E93]">to unlock</span>
            <span className="font-bold text-[#30D158]">+{formatMoney(next.bonus_cents)}</span>
          </p>
        )}
      </div>

      {/* Milestone ladder */}
      <div className="space-y-1.5">
        {sorted.map((m, i) => {
          const cleared = demoViews >= m.views;
          const isNext = !cleared && i === nextIdx;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] transition-all"
              style={{
                background: cleared
                  ? 'rgba(48,209,88,0.10)'
                  : isNext
                    ? 'rgba(255,159,10,0.08)'
                    : 'rgba(255,255,255,0.03)',
                border: cleared
                  ? '1px solid rgba(48,209,88,0.25)'
                  : isNext
                    ? '1px solid rgba(255,159,10,0.30)'
                    : '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background: cleared ? '#30D158' : isNext ? 'rgba(255,159,10,0.18)' : 'rgba(255,255,255,0.06)',
                }}
              >
                {cleared ? (
                  <Zap className="w-4 h-4 text-black" strokeWidth={2.8} fill="black" />
                ) : isNext ? (
                  <Flame className="w-4 h-4 text-[#FF9F0A]" strokeWidth={2.5} />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-[#48484A]" strokeWidth={2.5} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[14px] font-semibold tabular-nums ${cleared ? 'text-white' : isNext ? 'text-white' : 'text-[#8E8E93]'}`}>
                  {formatViews(m.views)} views
                </p>
                {isNext && (
                  <p className="text-[10px] text-[#FF9F0A] font-bold uppercase tracking-wide">Next unlock</p>
                )}
                {cleared && (
                  <p className="text-[10px] text-[#30D158] font-bold uppercase tracking-wide">Cleared</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-apple-tight text-[16px] font-bold tabular-nums" style={{ color: cleared ? '#30D158' : isNext ? '#FF9F0A' : '#48484A' }}>
                  +{formatMoney(m.bonus_cents)}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <p className="text-[11px] text-[#8E8E93] text-center mt-3 inline-flex items-center justify-center gap-1 w-full">
        <TrendingUp className="w-3 h-3" />
        Hit a tier → cash out instantly
      </p>
    </div>
  );
}