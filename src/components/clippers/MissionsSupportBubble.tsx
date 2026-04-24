import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Clock3, Sparkles, ArrowUpRight, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'missions_support_bubble_pos_v1';
const BUBBLE_SIZE = 56;
const EDGE_PAD = 14;

interface Pos { x: number; y: number; }

function clampToViewport(p: Pos): Pos {
  if (typeof window === 'undefined') return p;
  const w = window.innerWidth;
  const h = window.innerHeight;
  return {
    x: Math.min(Math.max(EDGE_PAD, p.x), w - BUBBLE_SIZE - EDGE_PAD),
    y: Math.min(Math.max(EDGE_PAD + 60, p.y), h - BUBBLE_SIZE - EDGE_PAD - 80),
  };
}

function defaultPos(): Pos {
  if (typeof window === 'undefined') return { x: 20, y: 400 };
  return clampToViewport({
    x: window.innerWidth - BUBBLE_SIZE - 18,
    y: window.innerHeight - BUBBLE_SIZE - 110,
  });
}

const FAQS: { q: string; a: string }[] = [
  { q: 'How fast do you reply?', a: 'Most messages get answered within 20 minutes during active hours. Worst case: a few hours.' },
  { q: 'When do I get paid?', a: 'Payouts go out within 24h after your clip is approved. Cash out anytime from the Cashout tab.' },
  { q: 'Can I post on multiple accounts?', a: 'Yep — link them all in the Linked tab. Every approved clip from any verified account counts.' },
  { q: 'Why was my clip rejected?', a: 'Usually wrong song, watermark, low quality, or already submitted. Tap the clip in your Clips tab for the exact reason.' },
];

export default function MissionsSupportBubble() {
  const navigate = useNavigate();
  const [pos, setPos] = useState<Pos>(defaultPos);
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const offsetRef = useRef<Pos>({ x: 0, y: 0 });

  // Hydrate stored position
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPos(clampToViewport(JSON.parse(raw)));
    } catch { /* noop */ }
  }, []);

  // Auto-dismiss hint after a few seconds
  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 6000);
    return () => clearTimeout(t);
  }, []);

  // Re-clamp on resize
  useEffect(() => {
    const onResize = () => setPos(p => clampToViewport(p));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    movedRef.current = false;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    offsetRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const next = { x: e.clientX - offsetRef.current.x, y: e.clientY - offsetRef.current.y };
    if (Math.abs(next.x - pos.x) + Math.abs(next.y - pos.y) > 4) movedRef.current = true;
    setPos(clampToViewport(next));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    // Snap to nearest horizontal edge for that classic iOS floating-bubble feel
    const w = window.innerWidth;
    const snapX = pos.x + BUBBLE_SIZE / 2 < w / 2 ? EDGE_PAD : w - BUBBLE_SIZE - EDGE_PAD;
    const snapped = clampToViewport({ x: snapX, y: pos.y });
    setPos(snapped);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(snapped)); } catch { /* noop */ }
    if (!movedRef.current) {
      setOpen(true);
      setShowHint(false);
    }
  };

  const openLoopyChat = () => {
    setOpen(false);
    navigate('/loopy?new=1');
  };

  const bubble = (
    <>
      {/* Floating bubble */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        style={{ left: pos.x, top: pos.y, width: BUBBLE_SIZE, height: BUBBLE_SIZE }}
        className="fixed z-[80] touch-none select-none"
      >
        {/* Hint pill */}
        <AnimatePresence>
          {showHint && !open && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className="absolute -top-9 right-0 whitespace-nowrap px-3 h-7 inline-flex items-center gap-1.5 rounded-full text-[12px] font-medium text-white pointer-events-none"
              style={{
                background: 'rgba(28,28,30,0.85)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '0.5px solid rgba(255,255,255,0.12)',
                boxShadow: '0 8px 24px -8px rgba(0,0,0,0.5)',
              }}
            >
              <Clock3 className="w-3 h-3 text-[#30D158]" strokeWidth={2.5} />
              Replies in ~20 min
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          aria-label="Mission support"
          className="relative w-full h-full rounded-full inline-flex items-center justify-center text-white active:scale-[0.92] transition-transform overflow-hidden"
          style={{
            background:
              'radial-gradient(120% 120% at 30% 20%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.08) 35%, rgba(255,255,255,0.02) 60%, rgba(0,0,0,0.05) 100%)',
            border: '0.5px solid rgba(255,255,255,0.28)',
            boxShadow:
              '0 18px 44px -12px rgba(0,0,0,0.6), 0 4px 14px -2px rgba(48,209,88,0.18), 0 1.5px 0 rgba(255,255,255,0.45) inset, 0 -2px 0 rgba(0,0,0,0.35) inset, 0 0 0 0.5px rgba(255,255,255,0.18) inset',
            backdropFilter: 'blur(28px) saturate(200%)',
            WebkitBackdropFilter: 'blur(28px) saturate(200%)',
          }}
        >
          {/* Inner liquid tint */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background:
                'radial-gradient(80% 80% at 70% 80%, rgba(48,209,88,0.22) 0%, rgba(10,132,255,0.12) 40%, transparent 75%)',
            }}
          />
          {/* Top sheen */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-1.5 top-1 h-3.5 rounded-full"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.18) 60%, rgba(255,255,255,0))',
              filter: 'blur(0.4px)',
            }}
          />
          {/* Bottom rim glow */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-2 bottom-1 h-2 rounded-full"
            style={{
              background: 'linear-gradient(0deg, rgba(255,255,255,0.18), rgba(255,255,255,0))',
              filter: 'blur(1px)',
            }}
          />
          {/* Specular pinpoint */}
          <span
            aria-hidden
            className="pointer-events-none absolute top-[18%] left-[26%] w-2.5 h-2.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.85)', filter: 'blur(1.5px)' }}
          />
          <MessageCircle className="w-[22px] h-[22px] relative drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]" strokeWidth={2.4} />
          {/* Live green dot */}
          <span
            aria-hidden
            className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full"
            style={{
              background: '#30D158',
              boxShadow: '0 0 0 2px rgba(0,0,0,0.45), 0 0 10px rgba(48,209,88,0.85)',
            }}
          />
        </button>
      </motion.div>

      {/* Sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center"
            onClick={() => setOpen(false)}
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          >
            <motion.div
              initial={{ y: 60, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-md rounded-t-[28px] sm:rounded-[28px] overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, rgba(44,44,46,0.92) 0%, rgba(28,28,30,0.96) 100%)',
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                border: '0.5px solid rgba(255,255,255,0.12)',
                boxShadow: '0 -20px 60px -10px rgba(0,0,0,0.7)',
              }}
            >
              {/* Grabber */}
              <div className="pt-2.5 pb-1 flex justify-center sm:hidden">
                <div className="w-9 h-[5px] rounded-full bg-white/25" />
              </div>

              {/* Header */}
              <div className="px-5 pt-3 pb-4 flex items-start gap-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 relative"
                  style={{
                    background: 'linear-gradient(180deg, #34C759 0%, #1FB84A 100%)',
                    boxShadow: '0 8px 20px -6px rgba(48,209,88,0.55), 0 1px 0 rgba(255,255,255,0.35) inset',
                  }}
                >
                  <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[18px] font-semibold text-white tracking-[-0.01em] leading-tight">Mission Support</h3>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[#8E8E93]">
                    <span className="relative flex w-1.5 h-1.5">
                      <span className="absolute inset-0 rounded-full bg-[#30D158] animate-ping opacity-60" />
                      <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-[#30D158]" />
                    </span>
                    <span>We reply within ~20 min in most cases</span>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="w-8 h-8 rounded-full inline-flex items-center justify-center text-[#8E8E93] active:opacity-60"
                  style={{ background: 'rgba(118,118,128,0.24)' }}
                >
                  <X className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>

              {/* FAQ list */}
              <div className="px-4">
                <p className="text-[11px] uppercase tracking-wide text-[#8E8E93] font-medium px-1 mb-1.5">Quick answers</p>
                <div
                  className="rounded-[16px] overflow-hidden"
                  style={{ background: 'rgba(118,118,128,0.16)', border: '0.5px solid rgba(255,255,255,0.06)' }}
                >
                  {FAQS.map((f, i) => {
                    const isOpen = expandedFaq === i;
                    return (
                      <button
                        key={i}
                        onClick={() => setExpandedFaq(isOpen ? null : i)}
                        className={`w-full text-left px-4 py-3 active:bg-white/[0.04] transition-colors ${i > 0 ? 'border-t border-white/[0.06]' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex-1 text-[14px] font-medium text-white">{f.q}</span>
                          <ChevronRight
                            className={`w-4 h-4 text-[#8E8E93] transition-transform ${isOpen ? 'rotate-90' : ''}`}
                            strokeWidth={2.5}
                          />
                        </div>
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.p
                              initial={{ height: 0, opacity: 0, marginTop: 0 }}
                              animate={{ height: 'auto', opacity: 1, marginTop: 6 }}
                              exit={{ height: 0, opacity: 0, marginTop: 0 }}
                              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                              className="text-[13px] text-[#AEAEB2] leading-[1.45] overflow-hidden"
                            >
                              {f.a}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CTA — open new chat */}
              <div className="p-4 pt-4 pb-[max(env(safe-area-inset-bottom),16px)]">
                <button
                  onClick={openLoopyChat}
                  className="relative w-full h-[54px] rounded-[16px] inline-flex items-center justify-center gap-2 text-[16px] font-semibold text-white overflow-hidden active:scale-[0.985] transition-transform"
                  style={{
                    background: 'linear-gradient(180deg, #0A84FF 0%, #0066D6 100%)',
                    boxShadow:
                      '0 12px 28px -8px rgba(10,132,255,0.55), 0 2px 0 rgba(255,255,255,0.3) inset, 0 -2px 0 rgba(0,0,0,0.18) inset',
                    border: '0.5px solid rgba(255,255,255,0.22)',
                  }}
                >
                  <span
                    aria-hidden
                    className="absolute inset-x-3 top-1 h-[18px] rounded-full pointer-events-none"
                    style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.45), rgba(255,255,255,0))' }}
                  />
                  <span className="relative">Start a new chat</span>
                  <ArrowUpRight className="w-[18px] h-[18px] relative" strokeWidth={2.5} />
                </button>
                <p className="text-[11px] text-[#8E8E93] text-center mt-2">
                  Still stuck? Open a thread and we'll get back to you.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(bubble, document.body);
}