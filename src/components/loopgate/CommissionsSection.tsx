import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DollarSign, ArrowRight, Clock, Users, CheckCircle2, Wallet, ChevronRight, Star, Music } from 'lucide-react';
import { useCommissions, useEditorEarnings, RATING_PAYOUTS, RATING_COLORS, type Commission, type SubmissionRating } from '@/hooks/useCommissions';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { InfinityLoop } from '@/components/loopgate/InfinityLoop';

const RATINGS: SubmissionRating[] = ['S', 'A', 'B', 'C', 'D', 'F'];

function BalanceStrip() {
  const { user } = useAuth();
  const { availableBalance, earnings } = useEditorEarnings();

  if (!user) return null;

  return (
    <Link to="/payouts">
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="bg-gradient-to-r from-emerald-950/60 via-emerald-950/40 to-surface-1 border border-emerald-500/20 hover:border-emerald-500/40 rounded-lg px-4 py-3 flex items-center justify-between transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-400/70">Your Balance</p>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-xl text-emerald-400">${(availableBalance / 100).toFixed(2)}</span>
              {earnings.earnings_cents > 0 && (
                <span className="text-[9px] text-muted-foreground ml-1">earned ${(earnings.earnings_cents / 100).toFixed(2)} total</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-emerald-400/60 text-[10px] font-bold">
          Cash Out <ChevronRight className="w-3 h-3" />
        </div>
      </motion.div>
    </Link>
  );
}

function SoloArenaCTA() {
  return (
    <Link to="/solo-arena">
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="bg-gradient-to-r from-amber-950/40 via-amber-950/20 to-surface-1 border border-amber-500/20 hover:border-amber-500/40 rounded-lg p-4 transition-colors"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center">
              <InfinityLoop size={18} />
            </div>
            <div>
              <h4 className="font-display text-sm text-foreground">SOLO ARENA</h4>
              <p className="text-[9px] text-muted-foreground">Pick a song · Submit your edit · Earn up to $5</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-amber-400 text-[10px] font-bold">
            Enter <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Payout tiers inline */}
        <div className="flex gap-1.5 flex-wrap">
          {RATINGS.map(r => {
            const p = RATING_PAYOUTS[r];
            return (
              <div key={r} className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${RATING_COLORS[r]}`}>
                {r}{p > 0 ? ` $${p / 100}` : ' IDX'}
              </div>
            );
          })}
        </div>
      </motion.div>
    </Link>
  );
}

function CommissionCard({ commission }: { commission: Commission }) {
  const payout = (commission.payout_cents / 100).toFixed(0);
  const slotsLeft = commission.max_slots - commission.accepted_count;
  const isFilled = commission.status === 'filled' || slotsLeft <= 0;
  const isExpired = commission.deadline && new Date(commission.deadline) < new Date();

  return (
    <Link to={`/commissions/${commission.id}`} className="shrink-0">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`w-[240px] sm:w-[260px] overflow-hidden border rounded-lg transition-all duration-300 group ${
          isFilled || isExpired
            ? 'bg-surface-1/40 border-border/30 opacity-60'
            : 'bg-surface-1/80 border-emerald-500/20 hover:border-emerald-500/50 hover:shadow-[0_4px_24px_rgba(16,185,129,0.1)]'
        }`}
      >
        <div className="relative px-3 py-2 bg-gradient-to-r from-emerald-950/60 to-surface-1 border-b border-emerald-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-display text-lg text-emerald-400 leading-none">${payout}</span>
            </div>
            {isFilled ? (
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/50 px-1.5 py-0.5 rounded">Filled</span>
            ) : isExpired ? (
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/50 px-1.5 py-0.5 rounded">Expired</span>
            ) : (
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-wider">Open</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-3">
          <h4 className="font-display text-xs text-foreground leading-tight truncate group-hover:text-emerald-300 transition-colors">
            {commission.title}
          </h4>
          {commission.artist_name && (
            <p className="text-[9px] text-muted-foreground mt-0.5 truncate">
              {commission.artist_name}{commission.song_name ? ` · ${commission.song_name}` : ''}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-muted-foreground" />
              <span className="text-[9px] text-muted-foreground">
                {slotsLeft > 0 ? `${slotsLeft} slot${slotsLeft !== 1 ? 's' : ''}` : 'Full'}
              </span>
            </div>
            {commission.submission_count > 0 && (
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400/60" />
                <span className="text-[9px] text-emerald-400/80">{commission.submission_count}</span>
              </div>
            )}
            {commission.deadline && !isExpired && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-muted-foreground/60" />
                <span className="text-[9px] text-muted-foreground">
                  {formatDistanceToNow(new Date(commission.deadline), { addSuffix: true })}
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

export default function CommissionsSection() {
  const { commissions, loading } = useCommissions();
  const openCommissions = commissions.filter(c => c.status === 'open' && (!c.deadline || new Date(c.deadline) > new Date()));

  if (loading) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.12 }}
      className="mt-2 relative"
    >
      {/* Emerald accent line */}
      <div className="relative h-[1px] pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
      </div>

      {/* Section Header */}
      <div className="relative flex items-center justify-between px-4 pt-2.5 mb-2">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <h3 className="font-display text-sm text-foreground">GET PAID</h3>
          <span className="text-[8px] px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase tracking-widest rounded">
            Live
          </span>
        </div>
        <Link to="/commissions" className="text-[9px] text-muted-foreground hover:text-emerald-400 transition-colors flex items-center gap-1">
          All Commissions <ArrowRight size={10} />
        </Link>
      </div>

      <div className="px-4 space-y-3">
        {/* Balance strip */}
        <BalanceStrip />

        {/* Solo Arena CTA */}
        <SoloArenaCTA />

        {/* Open commissions horizontal scroll */}
        {openCommissions.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Star className="w-3 h-3 text-emerald-400/60" /> Bounties ({openCommissions.length})
              </p>
            </div>
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className="flex gap-3 pb-2">
                {openCommissions.slice(0, 8).map(c => (
                  <CommissionCard key={c.id} commission={c} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
