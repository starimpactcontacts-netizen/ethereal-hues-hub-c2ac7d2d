import { useEffect, useState } from 'react';
import { Check, ArrowUpRight, ArrowDownToLine } from 'lucide-react';

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

  useEffect(() => {
    if (!maxViews) return;
    let raf = 0;
    let last = performance.now();
    let v = 0;
    let velocity = maxViews / 14000; // calmer climb ~14s
    const loop = (t: number) => {
      const dt = t - last;
      last = t;
      const jitter = (Math.random() - 0.4) * velocity * dt * 0.25;
      v += velocity * dt + jitter;
      if (v >= maxViews * 1.05) v = 0;
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

  // Sparkline — calm Stocks-app curve
  const spark = Array.from({ length: 32 }, (_, i) => {
    const seed = (tick + i * 7) % 100;
    return 40 + Math.sin((tick * 0.3 + i) * 0.25) * 12 + (seed % 8);
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
      {/* Header — Live earnings (trading-style) */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[13px] font-semibold text-white tracking-[-0.01em]">Live earnings</p>
          <p className="text-[11px] text-[#8E8E93] tracking-[-0.01em]">Updated as your clip grows</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-[#8E8E93] tracking-[-0.01em]">Max payout</p>
          <p className="text-[13px] font-semibold text-white tabular-nums tracking-[-0.01em]">{formatMoney(totalPool)}</p>
        </div>
      </div>

      {/* MAIN — clean iOS Stocks card */}
      <div className="rounded-[16px] p-4 mb-3" style={{ background: '#161618' }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-[#8E8E93] tracking-[-0.01em] mb-1">Current views</p>
            <p className="font-apple-tight text-[34px] font-semibold text-white leading-none tabular-nums tracking-[-0.025em]">
              {formatViews(demoViews)}
            </p>
            <div className="inline-flex items-center gap-1 mt-1.5">
              <ArrowUpRight className="w-3 h-3 text-[#30D158]" strokeWidth={2.5} />
              <span className="text-[12px] font-medium text-[#30D158] tabular-nums tracking-[-0.01em]">
                +{((demoViews / maxViews) * 100).toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="w-[96px] h-[52px] shrink-0">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
              <path d={sparkPath} fill="none" stroke="#30D158" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Progress — single hairline bar */}
        <div className="mt-4">
          <div className="relative h-[3px] rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white transition-all duration-200"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-[#8E8E93] tracking-[-0.01em]">Available to cash out</p>
              <p className="text-[18px] font-semibold text-[#30D158] tabular-nums tracking-[-0.015em] leading-tight">{formatMoney(earned)}</p>
            </div>
            {next && (
              <div className="text-right">
                <p className="text-[11px] text-[#8E8E93] tracking-[-0.01em]">Next at {formatViews(next.views)}</p>
                <p className="text-[15px] font-semibold text-white tabular-nums tracking-[-0.01em]">+{formatMoney(next.bonus_cents)}</p>
              </div>
            )}
          </div>

          {/* Cash out CTA — always green, always inviting */}
          <button
            type="button"
            className="mt-3 w-full h-11 rounded-[12px] flex items-center justify-center gap-2 font-semibold text-[15px] tracking-[-0.01em] transition-all active:scale-[0.98] text-black"
            style={{ background: '#30D158' }}
          >
            <ArrowDownToLine className="w-4 h-4" strokeWidth={2.6} />
            Cash out {formatMoney(earned)}
          </button>
          <p className="text-[10.5px] text-[#8E8E93] text-center mt-2 tracking-[-0.01em]">
            Instant transfer · no minimum · no fees
          </p>
        </div>
      </div>

      {/* TIER ROWS — iOS settings-list aesthetic */}
      <div className="rounded-[16px] overflow-hidden" style={{ background: '#161618' }}>
        {sorted.map((m, i) => {
          const isCleared = demoViews >= m.views;
          const isNext = !isCleared && i === nextIdx;
          const remaining = Math.max(0, m.views - demoViews);
          const tierPct = Math.min(100, (demoViews / m.views) * 100);
          return (
            <div
              key={i}
              className="px-4 py-3"
              style={{
                borderTop: i === 0 ? 'none' : '0.5px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: isCleared ? '#30D158' : 'transparent',
                    border: isCleared ? 'none' : '1.25px solid rgba(255,255,255,0.18)',
                  }}
                >
                  {isCleared && <Check className="w-3 h-3 text-black" strokeWidth={3.5} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[15px] font-medium tabular-nums tracking-[-0.01em] ${isCleared || isNext ? 'text-white' : 'text-[#8E8E93]'}`}>
                    {formatViews(m.views)} views
                  </p>
                </div>
                <p className={`text-[15px] font-semibold tabular-nums tracking-[-0.01em] ${isCleared ? 'text-[#30D158]' : 'text-white'}`}>
                  +{formatMoney(m.bonus_cents)}
                </p>
              </div>

              {/* Motivating "almost there" panel — only on the next active tier */}
              {isNext && (
                <div className="mt-2.5 ml-8 rounded-[10px] px-3 py-2.5" style={{ background: 'rgba(48,209,88,0.08)', border: '0.5px solid rgba(48,209,88,0.25)' }}>
                  <div className="flex items-baseline justify-between gap-2 mb-1.5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-apple-tight text-[22px] font-semibold text-white tabular-nums leading-none tracking-[-0.02em]">
                        {formatViews(remaining)}
                      </span>
                      <span className="text-[11px] text-[#8E8E93] tracking-[-0.01em]">views away</span>
                    </div>
                    <span className="text-[11px] font-medium text-[#30D158] tabular-nums tracking-[-0.01em]">
                      unlocks {formatMoney(m.bonus_cents)}
                    </span>
                  </div>
                  <div className="relative h-[3px] rounded-full bg-white/[0.08] overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-[#30D158] transition-all duration-200"
                      style={{ width: `${tierPct}%` }}
                    />
                  </div>
                  <p className="text-[10.5px] text-[#8E8E93] tracking-[-0.01em] mt-1.5">
                    Hits {formatViews(m.views)} views → {formatMoney(m.bonus_cents)} added to your balance instantly.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-[#8E8E93] text-center mt-3 tracking-[-0.01em]">
        Hit a tier and withdraw instantly.
      </p>
    </div>
  );
}