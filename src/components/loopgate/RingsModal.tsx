import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X, ShoppingBag, Sparkles, TrendingUp } from 'lucide-react';
import RingsCoin from './RingsCoin';

interface RingsModalProps {
  open: boolean;
  onClose: () => void;
  amount: number;
}

export default function RingsModal({ open, onClose, amount }: RingsModalProps) {
  const navigate = useNavigate();

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-md"
          />

          {/* Sheet */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="fixed inset-x-3 bottom-3 sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[400px] z-[9999]"
          >
            <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-b from-zinc-900 via-zinc-950 to-black">
              {/* Ambient gold glow */}
              <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[420px] h-[420px] bg-amber-500/[0.18] rounded-full blur-[100px]" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(245,158,11,0.12),transparent_70%)]" />

              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-foreground/70 hover:text-foreground transition-all active:scale-90"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>

              <div className="relative px-6 pt-10 pb-6 flex flex-col items-center text-center">
                {/* Spinning coin */}
                <motion.div
                  initial={{ scale: 0.5, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.1 }}
                >
                  <RingsCoin size={120} spin />
                </motion.div>

                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.25em] text-amber-300/80">
                  Your Balance
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-display text-6xl tracking-tight tabular-nums text-foreground leading-none">
                    {amount.toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-[13px] font-bold uppercase tracking-[0.2em] text-amber-200">
                  Rings
                </p>

                <p className="mt-4 text-[12px] text-foreground/60 leading-relaxed max-w-[280px]">
                  Spend Rings on cosmetics, badges, prestige skins & limited drops in the Shop.
                </p>

                {/* How to earn */}
                <div className="mt-5 w-full grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] px-3 py-2.5 text-left">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400 mb-1.5" strokeWidth={2.5} />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/90">Win Battles</p>
                    <p className="text-[10px] text-foreground/50 mt-0.5">Earn Rings every match</p>
                  </div>
                  <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] px-3 py-2.5 text-left">
                    <Sparkles className="w-3.5 h-3.5 text-violet-300 mb-1.5" strokeWidth={2.5} />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/90">Drops & Events</p>
                    <p className="text-[10px] text-foreground/50 mt-0.5">Stack Rings from missions</p>
                  </div>
                </div>

                {/* CTA */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { onClose(); navigate('/shop'); }}
                  className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-foreground text-background font-bold text-[14px] uppercase tracking-wider rounded-2xl py-3.5 active:opacity-90 transition-opacity"
                >
                  <ShoppingBag className="w-4 h-4" strokeWidth={2.5} />
                  Open Shop
                </motion.button>

                <p className="mt-3 text-[9px] uppercase tracking-[0.25em] text-foreground/30 font-semibold">
                  Loopgate Currency · Non-redeemable
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
