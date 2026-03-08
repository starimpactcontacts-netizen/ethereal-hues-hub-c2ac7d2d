import { useState } from 'react';
import { DollarSign, Info, X } from 'lucide-react';
import { createPortal } from 'react-dom';

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
            <div className="fixed inset-0 z-[99] bg-black/60" onClick={() => setShowInfo(false)} />
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              className="fixed z-[100] left-4 right-4 bottom-20 sm:absolute sm:left-auto sm:right-0 sm:bottom-auto sm:top-full sm:mt-2 sm:w-64 bg-black border border-gold/30 shadow-2xl shadow-black/60 p-4 rounded-lg"
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
                Win official Arena events and drops to earn real payouts. 
                Your <span className="text-gold font-bold">Index</span> tracks your competitive value — 
                the higher you rank, the more you earn.
              </p>
              <div className="mt-2 pt-2 border-t border-border/50">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
                  First platform where editing pays.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </span>
  );
}
