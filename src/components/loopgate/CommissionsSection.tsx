import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DollarSign, ArrowRight, Clock, Users, CheckCircle2 } from 'lucide-react';
import { useCommissions, type Commission } from '@/hooks/useCommissions';
import { formatDistanceToNow } from 'date-fns';

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
        className={`w-[260px] sm:w-[280px] overflow-hidden border transition-all duration-300 group ${
          isFilled || isExpired
            ? 'bg-surface-1/40 border-border/30 opacity-60'
            : 'bg-surface-1/80 border-emerald-500/20 hover:border-emerald-500/50 hover:shadow-[0_4px_24px_rgba(16,185,129,0.1)]'
        }`}
      >
        {/* Top bar — payout */}
        <div className="relative px-3 py-2.5 bg-gradient-to-r from-emerald-950/60 to-surface-1 border-b border-emerald-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="font-display text-lg text-emerald-400 leading-none">${payout}</span>
            </div>
            {isFilled ? (
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/50 px-1.5 py-0.5">Filled</span>
            ) : isExpired ? (
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/50 px-1.5 py-0.5">Expired</span>
            ) : (
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-wider">Open</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
          <h4 className="font-display text-sm text-foreground leading-tight truncate group-hover:text-emerald-300 transition-colors">
            {commission.title}
          </h4>
          {commission.artist_name && (
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              {commission.artist_name}{commission.song_name ? ` · ${commission.song_name}` : ''}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2.5">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">
                {slotsLeft > 0 ? `${slotsLeft} slot${slotsLeft !== 1 ? 's' : ''} left` : 'Full'}
              </span>
            </div>
            {commission.submission_count > 0 && (
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400/60" />
                <span className="text-[10px] text-emerald-400/80">{commission.submission_count} submitted</span>
              </div>
            )}
          </div>

          {commission.deadline && !isExpired && (
            <div className="flex items-center gap-1 mt-1.5">
              <Clock className="w-3 h-3 text-muted-foreground/60" />
              <span className="text-[9px] text-muted-foreground">
                {formatDistanceToNow(new Date(commission.deadline), { addSuffix: true })}
              </span>
            </div>
          )}
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
          <span className="text-[8px] px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase tracking-widest">
            Commissions
          </span>
          <span className="text-[9px] text-muted-foreground">({openCommissions.length} open)</span>
        </div>
        <Link to="/commissions" className="text-[9px] text-muted-foreground hover:text-emerald-400 transition-colors flex items-center gap-1">
          VIEW ALL <ArrowRight size={10} />
        </Link>
      </div>

      {/* Horizontal scroll */}
      {openCommissions.length > 0 ? (
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 px-4 pb-2">
            {openCommissions.slice(0, 8).map(c => (
              <CommissionCard key={c.id} commission={c} />
            ))}
          </div>
        </div>
      ) : (
        <div className="px-4 pb-2">
          <Link to="/commissions">
            <div className="bg-surface-1/60 border border-emerald-500/10 hover:border-emerald-500/30 transition-colors p-4 text-center">
              <p className="text-xs text-muted-foreground">No open commissions right now</p>
              <p className="text-[10px] text-emerald-400/60 mt-1">Check back soon for paid editing opportunities →</p>
            </div>
          </Link>
        </div>
      )}
    </motion.div>
  );
}
