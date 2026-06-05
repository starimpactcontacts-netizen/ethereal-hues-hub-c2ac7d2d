import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X, ShoppingBag, CreditCard, Swords } from 'lucide-react';
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
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto overscroll-contain"
            style={{
              paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)',
              paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
              paddingLeft: 'max(env(safe-area-inset-left, 0px), 12px)',
              paddingRight: 'max(env(safe-area-inset-right, 0px), 12px)',
              WebkitOverflowScrolling: 'touch',
            }}
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[420px] max-h-[calc(100dvh-32px)] my-auto overflow-y-auto rounded-[22px] border border-border/70 bg-card shadow-2xl"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-foreground/20" />

              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground transition-all hover:text-foreground active:scale-90"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>

              <div className="relative flex flex-col items-center px-5 pb-5 pt-7 text-center sm:px-6 sm:pb-6">
                {/* Spinning coin */}
                <motion.div
                  initial={{ scale: 0.5, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.1 }}
                  className="rounded-full border border-border bg-secondary/60 p-2 shadow-inner"
                >
                  <RingsCoin size={72} spin />
                </motion.div>

                <p className="mt-4 text-[10px] font-display font-black uppercase tracking-[0.28em] text-muted-foreground">
                  Your Balance
                </p>
                <div className="mt-1 flex items-baseline justify-center gap-2">
                  <span className="font-display text-[64px] font-semibold leading-[0.8] tabular-nums text-foreground">
                    {amount.toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-[15px] font-display font-black uppercase tracking-[0.26em] text-foreground">
                  Rings
                </p>

                <p className="mt-3 max-w-[310px] text-[12px] font-semibold leading-relaxed text-muted-foreground">
                  Spend Rings on cosmetics, badges, prestige skins & limited drops in the Shop.
                </p>

                {/* How to earn */}
                <div className="mt-5 grid w-full grid-cols-2 gap-2">
                  <div className="rounded-xl border border-border bg-secondary px-3 py-3 text-left">
                    <Swords className="mb-2 h-4 w-4 text-arena-emerald" strokeWidth={2.5} />
                    <p className="text-[10px] font-display font-black uppercase tracking-[0.16em] text-foreground">Grind</p>
                    <p className="mt-0.5 text-[10px] font-display font-semibold leading-snug text-muted-foreground">Join events to get rings</p>
                  </div>
                  <div className="rounded-xl border border-border bg-secondary px-3 py-3 text-left">
                    <CreditCard className="mb-2 h-4 w-4 text-gold" strokeWidth={2.5} />
                    <p className="text-[10px] font-display font-black uppercase tracking-[0.16em] text-foreground">Buy</p>
                    <p className="mt-0.5 text-[10px] font-display font-semibold leading-snug text-muted-foreground">Top up instantly</p>
                  </div>
                </div>

                {/* CTA */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { onClose(); navigate('/shop'); }}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-[14px] font-display font-black uppercase tracking-[0.18em] text-primary-foreground transition-opacity active:opacity-90"
                >
                  <ShoppingBag className="w-4 h-4" strokeWidth={2.5} />
                  Shop
                </motion.button>

                <p className="mt-3 text-[9px] font-display font-black uppercase tracking-[0.28em] text-muted-foreground/60">
                  Loopgate Currency · Separate from Index
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
