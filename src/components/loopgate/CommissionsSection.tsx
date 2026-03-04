import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DollarSign, ArrowRight, Clock, Users, CheckCircle2, Wallet, ChevronRight, Star } from 'lucide-react';
import { useCommissions, useEditorEarnings, RATING_PAYOUTS, RATING_COLORS, type Commission, type SubmissionRating } from '@/hooks/useCommissions';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { InfinityLoop } from '@/components/loopgate/InfinityLoop';

const TIER_DATA: { grade: SubmissionRating; label: string; cash: boolean }[] = [
  { grade: 'S', label: '$5', cash: true },
  { grade: 'A', label: '$3', cash: true },
  { grade: 'B', label: '$1', cash: true },
  { grade: 'C', label: 'IDX', cash: false },
  { grade: 'D', label: 'IDX', cash: false },
  { grade: 'F', label: '—', cash: false },
];

function BalanceStrip() {
  const { user } = useAuth();
  const { availableBalance, earnings } = useEditorEarnings();

  if (!user) return null;

  return (
    <Link to="/payouts">
      <motion.div
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        className="relative overflow-hidden rounded-xl border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 group"
      >
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/80 via-emerald-950/40 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,_rgba(16,185,129,0.08)_0%,transparent_70%)]" />
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-400/0" />

        <div className="relative flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-emerald-400/60">Balance</p>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-2xl text-emerald-400 leading-none">${(availableBalance / 100).toFixed(2)}</span>
                {earnings.earnings_cents > 0 && (
                  <span className="text-[8px] text-emerald-400/40 font-medium">${(earnings.earnings_cents / 100).toFixed(0)} lifetime</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-emerald-400/50 group-hover:text-emerald-400 text-[9px] font-bold tracking-wider uppercase transition-colors">
            Cash Out <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

function SoloArenaHero() {
  return (
    <Link to="/solo-arena" className="block">
      <motion.div
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        className="relative overflow-hidden rounded-2xl group cursor-pointer"
      >
        {/* Multi-layer background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950/90 via-background to-emerald-950/40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.12)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.08)_0%,transparent_50%)]" />
        
        {/* Animated scan line */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-400/[0.03] to-transparent"
          animate={{ y: [-100, 200] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          style={{ height: '60px' }}
        />

        {/* Grid texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />

        {/* Top accent border */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
        
        {/* Bottom accent border */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

        <div className="relative px-5 pt-5 pb-4">
          {/* Header row */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* Glowing infinity icon */}
              <div className="relative">
                <div className="absolute inset-0 blur-xl bg-amber-500/20 rounded-full scale-150" />
                <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/20 flex items-center justify-center">
                  <InfinityLoop size={28} />
                </div>
              </div>
              <div>
                <h3 className="font-display text-xl text-foreground tracking-wide leading-none">SOLO ARENA</h3>
                <p className="text-[10px] text-amber-400/60 mt-0.5 font-medium">Edit songs. Get graded. Earn cash.</p>
              </div>
            </div>

            {/* Enter button */}
            <motion.div
              whileHover={{ x: 2 }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2 group-hover:border-amber-500/40 group-hover:from-amber-500/15 transition-all"
            >
              <span className="text-xs font-bold text-amber-400 tracking-wide">ENTER</span>
              <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
            </motion.div>
          </div>

          {/* Payout tiers - the money shot */}
          <div className="flex items-stretch gap-2">
            {TIER_DATA.map(({ grade, label, cash }) => (
              <motion.div
                key={grade}
                whileHover={{ y: -2, scale: 1.05 }}
                className={`flex-1 relative overflow-hidden rounded-lg border text-center py-2.5 transition-all ${
                  cash
                    ? 'border-emerald-500/25 bg-gradient-to-b from-emerald-500/10 to-emerald-500/5'
                    : 'border-border/20 bg-surface-1/40'
                }`}
              >
                {cash && (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.08)_0%,transparent_70%)]" />
                )}
                <div className="relative">
                  <span className={`text-lg font-black leading-none ${
                    grade === 'S' ? 'text-amber-400' :
                    grade === 'A' ? 'text-emerald-400' :
                    grade === 'B' ? 'text-blue-400' :
                    'text-muted-foreground/60'
                  }`}>{grade}</span>
                  <p className={`text-[10px] font-bold mt-0.5 ${
                    cash ? 'text-emerald-400' : 'text-muted-foreground/40'
                  }`}>{label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom tagline */}
          <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-amber-500/10">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] text-emerald-400/70 font-bold uppercase tracking-[0.15em]">Instant payouts</span>
            </div>
            <span className="text-muted-foreground/20">·</span>
            <span className="text-[9px] text-amber-400/50 font-medium uppercase tracking-wider">Up to $5 per edit</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

function BountyCard({ commission }: { commission: Commission }) {
  const payout = (commission.payout_cents / 100).toFixed(0);
  const slotsLeft = commission.max_slots - commission.accepted_count;
  const isFilled = commission.status === 'filled' || slotsLeft <= 0;
  const isExpired = commission.deadline && new Date(commission.deadline) < new Date();
  const isDead = isFilled || isExpired;

  return (
    <Link to={`/commissions/${commission.id}`} className="shrink-0">
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className={`w-[220px] sm:w-[240px] overflow-hidden rounded-xl border transition-all duration-300 group ${
          isDead
            ? 'bg-surface-1/30 border-border/20 opacity-50'
            : 'bg-gradient-to-b from-surface-1/80 to-background border-emerald-500/15 hover:border-emerald-500/40 hover:shadow-[0_8px_32px_rgba(16,185,129,0.12)]'
        }`}
      >
        {/* Payout header */}
        <div className="relative px-3 py-2.5 overflow-hidden">
          {!isDead && (
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/60 to-transparent" />
          )}
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span className="font-display text-2xl text-emerald-400 leading-none">{payout}</span>
            </div>
            {isDead ? (
              <span className="text-[7px] font-bold text-muted-foreground/60 uppercase tracking-widest bg-muted/30 px-2 py-0.5 rounded-full">
                {isFilled ? 'Filled' : 'Expired'}
              </span>
            ) : (
              <div className="flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[7px] font-bold text-emerald-400 uppercase tracking-widest">Open</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-3 pb-3 pt-1">
          <h4 className="font-display text-[11px] text-foreground leading-tight truncate group-hover:text-emerald-300 transition-colors">
            {commission.title}
          </h4>
          {commission.artist_name && (
            <p className="text-[9px] text-muted-foreground/60 mt-0.5 truncate">
              {commission.artist_name}{commission.song_name ? ` · ${commission.song_name}` : ''}
            </p>
          )}
          <div className="flex items-center gap-2.5 mt-2">
            <div className="flex items-center gap-1 text-[8px] text-muted-foreground/50">
              <Users className="w-2.5 h-2.5" />
              {slotsLeft > 0 ? `${slotsLeft} slot${slotsLeft !== 1 ? 's' : ''}` : 'Full'}
            </div>
            {commission.submission_count > 0 && (
              <div className="flex items-center gap-1 text-[8px] text-emerald-400/50">
                <CheckCircle2 className="w-2.5 h-2.5" />
                {commission.submission_count}
              </div>
            )}
            {commission.deadline && !isExpired && (
              <div className="flex items-center gap-1 text-[8px] text-muted-foreground/40">
                <Clock className="w-2.5 h-2.5" />
                {formatDistanceToNow(new Date(commission.deadline), { addSuffix: true })}
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
      className="mt-3 relative"
    >
      {/* Section Header */}
      <div className="relative flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <h3 className="font-display text-base text-foreground tracking-wide">GET PAID</h3>
          <span className="relative flex items-center gap-1 text-[7px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 font-bold uppercase tracking-[0.2em] rounded-full">
            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>
        <Link to="/commissions" className="text-[9px] text-muted-foreground/50 hover:text-emerald-400 transition-colors flex items-center gap-1 font-medium">
          All Commissions <ArrowRight size={10} />
        </Link>
      </div>

      <div className="px-4 space-y-3">
        {/* Balance */}
        <BalanceStrip />

        {/* Solo Arena Hero */}
        <SoloArenaHero />

        {/* Bounties */}
        {openCommissions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-3 h-3 text-amber-400/40" />
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
                Bounties ({openCommissions.length})
              </p>
            </div>
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className="flex gap-2.5 pb-2">
                {openCommissions.slice(0, 8).map(c => (
                  <BountyCard key={c.id} commission={c} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
