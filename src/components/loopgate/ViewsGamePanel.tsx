import { Check, ArrowUpRight, ArrowDownToLine, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Milestone { views: number; bonus_cents: number; }

const formatMoney = (cents: number) =>
  `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatViews = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
  return n.toLocaleString();
};

interface Props {
  milestones: Milestone[];
  /** Real views on the user's clip for this mission. undefined → no submission yet. */
  currentViews?: number | null;
  /** Real cents earned by this user on this mission. */
  earnedCents?: number | null;
  submissionStatus?: string | null;
  hasSubmission?: boolean;
}

export default function ViewsGamePanel({
  milestones,
  currentViews,
  earnedCents,
  submissionStatus,
  hasSubmission = false,
}: Props) {
  const sorted = [...milestones].sort((a, b) => a.views - b.views);
  const maxViews = sorted[sorted.length - 1]?.views || 1;
  const totalPool = sorted.reduce((s, m) => s + m.bonus_cents, 0);

  // Real values only — no fake animation
  const views = Math.max(0, currentViews ?? 0);
  const earned = Math.max(0, earnedCents ?? 0);
  const pct = Math.min(100, (views / maxViews) * 100);
  const nextIdx = sorted.findIndex((m) => views < m.views);
  const next = nextIdx >= 0 ? sorted[nextIdx] : null;
  const showEmpty = !hasSubmission;
  const isPending = hasSubmission && submissionStatus === 'pending';

  return (
    <div className="mt-4 pt-4 border-t border-white/[0.06]">
      {/* Header — Live earnings (trading-style) */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[13px] font-semibold text-white tracking-[-0.01em]">Your earnings</p>
          <p className="text-[11px] text-[#8E8E93] tracking-[-0.01em]">
            {showEmpty ? 'Submit a clip to start earning' : isPending ? 'Live once your clip is approved' : 'Updates as your clip grows'}
          </p>
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
              {showEmpty ? '—' : formatViews(views)}
            </p>
            {showEmpty ? (
              <p className="text-[11px] text-[#8E8E93] mt-1.5 tracking-[-0.01em]">No clip submitted yet</p>
            ) : (
              <div className="inline-flex items-center gap-1 mt-1.5">
                <ArrowUpRight className="w-3 h-3 text-[#30D158]" strokeWidth={2.5} />
                <span className="text-[12px] font-medium text-[#30D158] tabular-nums tracking-[-0.01em]">
                  {((views / maxViews) * 100).toFixed(2)}% of max tier
                </span>
              </div>
            )}
          </div>

          <div className="w-[52px] h-[52px] shrink-0 rounded-full flex items-center justify-center" style={{ background: 'rgba(48,209,88,0.10)' }}>
            <Eye className="w-5 h-5 text-[#30D158]" strokeWidth={2.25} />
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
              <p className="text-[11px] text-[#8E8E93] tracking-[-0.01em]">Earned on this mission</p>
              <p className="text-[18px] font-semibold text-[#30D158] tabular-nums tracking-[-0.015em] leading-tight">{formatMoney(earned)}</p>
            </div>
            {next && (
              <div className="text-right">
                <p className="text-[11px] text-[#8E8E93] tracking-[-0.01em]">Next at {formatViews(next.views)}</p>
                <p className="text-[15px] font-semibold text-white tabular-nums tracking-[-0.01em]">+{formatMoney(next.bonus_cents)}</p>
              </div>
            )}
          </div>

          {earned > 0 ? (
            <Link
              to="/missions/withdrawals"
              className="mt-3 w-full h-11 rounded-[12px] flex items-center justify-center gap-2 font-semibold text-[15px] tracking-[-0.01em] transition-all active:scale-[0.98] text-black"
              style={{ background: '#30D158' }}
            >
              <ArrowDownToLine className="w-4 h-4" strokeWidth={2.6} />
              <span>Cash out {formatMoney(earned)}</span>
            </Link>
          ) : (
            <div
              className="mt-3 w-full h-11 rounded-[12px] flex items-center justify-center text-[13px] tracking-[-0.01em]"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#8E8E93' }}
            >
              {showEmpty ? 'Submit your clip below to unlock' : isPending ? 'Awaiting review' : 'Earn views to unlock cashout'}
            </div>
          )}
          <p className="text-[10.5px] text-[#8E8E93] text-center mt-2 tracking-[-0.01em]">
            Instant transfer · no minimum · no fees
          </p>
        </div>
      </div>

      {/* TIER ROWS — iOS settings-list aesthetic */}
      <div className="rounded-[16px] overflow-hidden" style={{ background: '#161618' }}>
        {sorted.map((m, i) => {
          const isCleared = views >= m.views;
          const isNext = !isCleared && i === nextIdx;
          const remaining = Math.max(0, m.views - views);
          const tierPct = Math.min(100, (views / m.views) * 100);
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