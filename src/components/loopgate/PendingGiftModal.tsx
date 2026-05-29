import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import RingsCoin from './RingsCoin';

interface GiftPayload {
  type?: string;
  title?: string;
  message?: string;
  rings?: number;
}

export default function PendingGiftModal() {
  const { profile, refreshProfile } = useAuth();
  const gift = (profile as any)?.pending_gift_modal as GiftPayload | null | undefined;
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (gift && typeof gift === 'object') setOpen(true);
  }, [gift]);

  if (!profile || !gift) return null;

  const dismiss = async () => {
    if (closing) return;
    setClosing(true);
    setOpen(false);
    await supabase.from('profiles').update({ pending_gift_modal: null } as any).eq('id', profile.id);
    refreshProfile?.();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={dismiss}
            className="fixed inset-0 z-[9998] bg-black/85 backdrop-blur-md"
          />
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto"
            style={{
              paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)',
              paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
              paddingLeft: 12,
              paddingRight: 12,
            }}
            onClick={dismiss}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 360, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[400px] my-auto overflow-hidden rounded-[28px] border border-amber-400/20 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black"
            >
              <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[480px] h-[480px] bg-amber-500/20 rounded-full blur-[110px]" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(212,168,87,0.18),transparent_70%)]" />

              <button
                onClick={dismiss}
                className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.14] border border-white/10 flex items-center justify-center text-foreground/70"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>

              <div className="relative px-7 pt-10 pb-7 flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0.4, rotate: -40 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.1 }}
                >
                  <RingsCoin size={108} spin />
                </motion.div>

                <div className="mt-5 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.28em] text-amber-300/90">
                  <Sparkles className="w-3 h-3" strokeWidth={2.5} />
                  A Gift From Loopgate
                </div>

                <h2 className="mt-3 font-display text-3xl leading-tight text-foreground">
                  {gift.title || 'Thank you for playing Loopgate'}
                </h2>

                {typeof gift.rings === 'number' && gift.rings > 0 && (
                  <div className="mt-5 flex items-baseline gap-2">
                    <span className="text-amber-300 text-2xl font-bold">+</span>
                    <span className="font-display text-5xl tracking-tight tabular-nums text-foreground leading-none">
                      {gift.rings.toLocaleString()}
                    </span>
                    <span className="text-[13px] font-bold uppercase tracking-[0.2em] text-amber-200">
                      Rings
                    </span>
                  </div>
                )}

                {gift.message && (
                  <p className="mt-5 text-[13px] text-foreground/70 leading-relaxed max-w-[300px]">
                    {gift.message}
                  </p>
                )}

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={dismiss}
                  className="mt-7 w-full inline-flex items-center justify-center bg-amber-400 text-black font-bold text-[14px] uppercase tracking-wider rounded-2xl py-3.5 active:opacity-90"
                >
                  Claim & Continue
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}