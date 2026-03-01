import { useState } from 'react';
import { DollarSign, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface IndexEarnBadgeProps {
  size?: 'sm' | 'md';
  hideDollar?: boolean;
}

export default function IndexEarnBadge({ size = 'sm', hideDollar = false }: IndexEarnBadgeProps) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <span className="relative inline-flex items-center">
      {!hideDollar && <DollarSign className={`${size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} text-emerald-400`} />}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowInfo(v => !v); }}
        className="ml-0.5 hover:opacity-80 transition-opacity"
        aria-label="How to earn"
      >
        <Info className={`${size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-muted-foreground/60`} />
      </button>

      <AnimatePresence>
        {showInfo && (
          <>
            <div className="fixed inset-0 z-50" onClick={() => setShowInfo(false)} />
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              className="absolute z-50 top-full mt-2 right-0 w-56 bg-surface-1 border border-gold/30 shadow-xl shadow-black/40 p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Earn Money</span>
                </div>
                <button onClick={() => setShowInfo(false)} className="p-0.5 hover:bg-surface-2 transition-colors">
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
              <p className="text-[11px] text-foreground leading-relaxed">
                Your <span className="text-gold font-bold">Index</span> points translate to real earnings. 
                Compete in the Arena — win battles, complete drops, and get judged to earn Index that pays out.
              </p>
              <div className="mt-2 pt-2 border-t border-border/50">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
                  The only editing game that pays you.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </span>
  );
}
