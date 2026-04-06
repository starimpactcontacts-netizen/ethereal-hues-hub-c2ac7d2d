import { motion } from 'framer-motion';
import { Ticket, DollarSign, Eye, TrendingUp } from 'lucide-react';

interface JackpotEditStatsProps {
  jackpotCount: number;
  totalEarned: number;
  bestViews: number;
}

export default function JackpotEditStats({ jackpotCount, totalEarned, bestViews }: JackpotEditStatsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-amber-500/10 via-surface-1 to-orange-500/5 border border-amber-500/20 rounded-xl p-4"
    >
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center">
          <Ticket className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-display font-bold text-foreground">Jackpot Edits</p>
          <p className="text-[10px] text-muted-foreground">$50 bonus per viral edit (100k+ views)</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-black/20 rounded-lg p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Ticket className="w-3 h-3 text-amber-400" />
          </div>
          <p className="font-display text-xl font-bold text-amber-400">{jackpotCount}</p>
          <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Jackpots</p>
        </div>
        <div className="bg-black/20 rounded-lg p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <DollarSign className="w-3 h-3 text-emerald-400" />
          </div>
          <p className="font-display text-xl font-bold text-emerald-400">${totalEarned}</p>
          <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Earned</p>
        </div>
        <div className="bg-black/20 rounded-lg p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Eye className="w-3 h-3 text-blue-400" />
          </div>
          <p className="font-display text-xl font-bold text-foreground">
            {bestViews > 0 ? `${(bestViews / 1000).toFixed(0)}k` : '—'}
          </p>
          <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Best Views</p>
        </div>
      </div>

      {jackpotCount === 0 && (
        <p className="text-[9px] text-muted-foreground text-center mt-2.5 italic">
          No jackpots yet — get an edit to 100k+ views to unlock
        </p>
      )}
    </motion.div>
  );
}
