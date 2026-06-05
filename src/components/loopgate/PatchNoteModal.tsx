import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, ShoppingBag, Zap } from 'lucide-react';
import AuraUsername from './AuraUsername';

const VERSION = '1.13';
const SEEN_KEY = 'lg_patch_v113b_seen';

const TEKO = { fontFamily: 'Teko, sans-serif' };

const BULLETS = [
  { icon: Bell,        text: 'Notifications are live — activity, system updates and email alerts' },
  { icon: ShoppingBag, text: 'The Shop is open. Auras are the first drop — more cosmetics coming next week' },
  { icon: Zap,         text: 'Massive UI upgrade across battles, hub, profiles and lobbies' },
];

export default function PatchNoteModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(SEEN_KEY)) {
      const t = setTimeout(() => setOpen(true), 1400);
      return () => clearTimeout(t);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(SEEN_KEY, '1');
    setOpen(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9998] flex items-center justify-center overflow-y-auto"
          style={{
            paddingTop: 'max(1rem, env(safe-area-inset-top))',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
            paddingLeft: 16,
            paddingRight: 16,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={dismiss}
        >
          {/* Backdrop */}
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.87)', backdropFilter: 'blur(14px)' }} />

          <motion.div
            initial={{ opacity: 0, y: 48, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="relative w-full max-w-sm my-auto overflow-hidden rounded-2xl"
            style={{
              background: 'linear-gradient(160deg, #0d0d18 0%, #09090f 100%)',
              border: '1px solid rgba(255,255,255,0.09)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 48px 120px rgba(0,0,0,0.98), 0 12px 48px rgba(0,0,0,0.8)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Gold top accent */}
            <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, transparent 0%, #FFD060 35%, #fff8d0 50%, #FFD060 65%, transparent 100%)' }} />

            {/* Subtle grid overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.025]"
              style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '28px 28px' }}
            />

            {/* Close button */}
            <button
              onClick={dismiss}
              className="absolute top-3.5 right-3.5 w-7 h-7 flex items-center justify-center rounded-full transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="relative px-5 pt-5 pb-6">
              {/* Version + date row */}
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="px-2.5 py-0.5 rounded text-[10px] font-black tracking-[0.22em] uppercase"
                  style={{ background: 'rgba(255,208,96,0.14)', border: '1px solid rgba(255,208,96,0.38)', color: '#FFD060' }}
                >
                  v{VERSION}
                </span>
                <span className="text-[10px] tracking-[0.25em] uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  June 2026
                </span>
              </div>

              {/* Title */}
              <div style={{ ...TEKO, lineHeight: 1 }}>
                <div style={{ fontSize: 13, letterSpacing: '0.35em', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>LOOPGATE</div>
                <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: '0.06em', color: '#fff' }}>UPDATE</div>
              </div>

              {/* Shop aura preview panel */}
              <div
                className="mt-4 rounded-xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {/* Panel header */}
                <div
                  className="px-3 py-2 flex items-center gap-2"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
                >
                  <ShoppingBag className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.35)' }} />
                  <span style={{ ...TEKO, fontSize: 10, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>
                    SHOP NOW OPEN — AURAS
                  </span>
                </div>

                {/* Aura name previews — stacked rows, no clipping */}
                <div className="px-4 py-3 flex flex-col gap-2.5">
                  {[
                    { name: 'STEVE',     aura: 'steve',     dot: '#7db544' },
                    { name: 'HELLFIRE',  aura: 'hellfire',  dot: '#ff5500' },
                    { name: 'SOVEREIGN', aura: 'sovereign', dot: '#ffd700' },
                  ].map((a) => (
                    <div key={a.aura} className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: a.dot, boxShadow: `0 0 8px ${a.dot}` }}
                      />
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <AuraUsername
                          username={a.name}
                          aura={a.aura}
                          style={{ fontSize: 18, lineHeight: 1.1 } as React.CSSProperties}
                        />
                      </div>
                      <span
                        className="text-[9px] uppercase tracking-[0.22em] shrink-0"
                        style={{ color: 'rgba(255,255,255,0.32)', fontWeight: 700 }}
                      >
                        New
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bullet notes */}
              <ul className="mt-4 space-y-2.5">
                {BULLETS.map(({ icon: Icon, text }, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Icon className="w-3.5 h-3.5 mt-[1px] shrink-0" style={{ color: 'rgba(255,255,255,0.28)' }} />
                    <span className="text-[12px] leading-snug" style={{ color: 'rgba(255,255,255,0.55)' }}>{text}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={dismiss}
                className="mt-5 w-full h-12 flex items-center justify-center rounded-xl font-black uppercase tracking-[0.22em]"
                style={{
                  ...TEKO,
                  fontSize: 16,
                  background: 'linear-gradient(135deg, rgba(255,208,96,0.18), rgba(255,208,96,0.32))',
                  border: '1px solid rgba(255,208,96,0.5)',
                  color: '#FFD060',
                  boxShadow: '0 4px 24px rgba(255,208,96,0.12)',
                }}
              >
                LET'S GO
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
