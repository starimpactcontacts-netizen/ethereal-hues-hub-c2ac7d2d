import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import loopyWelcome from '@/assets/loopy-welcome.png';

const OG_ITEM_ID = '88ab63be-357e-4b09-9dc2-124a23caed3f';

export default function LoopyWelcomeModal() {
  const [show, setShow] = useState(false);
  const [ogNumber, setOgNumber] = useState<number | null>(null);
  const [confetti, setConfetti] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const { user, profile } = useAuth();

  useEffect(() => {
    const flag = sessionStorage.getItem('loopgate_just_signed_up');
    if (!flag) return;
    sessionStorage.removeItem('loopgate_just_signed_up');

    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .then(({ count }) => {
        setOgNumber(count || 1);
        setShow(true);
      });
  }, []);

  const handleClaim = async () => {
    if (claimed || !user) return;
    setConfetti(true);
    setClaimed(true);

    // Insert purchase + set founding member
    await Promise.all([
      supabase.from('shop_purchases').insert({
        user_id: user.id,
        item_id: OG_ITEM_ID,
        is_equipped: true,
      }),
      supabase.from('profiles').update({ is_founding_member: true } as any).eq('id', user.id),
    ]);
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShow(false)} />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="relative w-full max-w-[340px] rounded-[28px] overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #141416 0%, #0A0A0C 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* Confetti overlay */}
            <AnimatePresence>
              {confetti && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 pointer-events-none"
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{
                        x: '50%',
                        y: '50%',
                        scale: 0,
                        opacity: 1,
                      }}
                      animate={{
                        x: `${Math.random() * 100}%`,
                        y: `${Math.random() * 100}%`,
                        scale: [0, 1.5, 0],
                        opacity: [1, 1, 0],
                        rotate: Math.random() * 720,
                      }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="absolute w-2 h-2 rounded-full"
                      style={{
                        background: ['#FFD700', '#FF4444', '#7C3AED', '#10B981', '#F59E0B', '#EC4899'][i % 6],
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Subtle ambient glow */}
            <div
              className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.18), transparent 70%)', filter: 'blur(40px)' }}
            />

            {/* OG ribbon */}
            <div className="relative pt-7 pb-2 flex flex-col items-center">
              <div
                className="px-3 py-1 rounded-full flex items-center gap-1.5"
                style={{
                  background: 'rgba(245,158,11,0.08)',
                  border: '1px solid rgba(245,158,11,0.25)',
                }}
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span className="text-[9px] font-black tracking-[0.25em] uppercase text-amber-400">
                  OG #{ogNumber?.toLocaleString() ?? '—'}
                </span>
              </div>
            </div>

            {/* Loopy mascot — clean framed */}
            <div className="relative px-6 pt-3">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 22 }}
                className="relative mx-auto w-32 h-32 rounded-2xl flex items-center justify-center overflow-hidden"
                style={{
                  background: 'radial-gradient(ellipse at top, rgba(255,255,255,0.04), transparent 70%)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <motion.img
                  src={loopyWelcome}
                  alt="Loopy"
                  className="w-28 h-28 object-contain"
                  style={{ imageRendering: 'auto' }}
                  animate={{ y: [0, -3, 0] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                />
              </motion.div>
            </div>

            {/* Content */}
            <div className="relative px-6 pt-5 pb-6 text-center">
              <motion.div
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                <h2 className="font-display text-[26px] leading-none text-white tracking-tight">
                  Welcome, {profile?.username || 'Editor'}
                </h2>
                <p className="mt-2 text-[12px] text-white/50 leading-relaxed max-w-[260px] mx-auto">
                  You're now part of Loopgate's first circle. Claim your founding badge below.
                </p>
              </motion.div>

              {/* Badge card */}
              <motion.div
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="mt-5 flex items-center gap-3 p-3 rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05))',
                    border: '1px solid rgba(245,158,11,0.3)',
                  }}
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-white leading-tight">First Circle</p>
                  <p className="text-[9px] tracking-[0.15em] uppercase text-white/40 mt-0.5">Limited Edition</p>
                </div>
                <button
                  onClick={handleClaim}
                  disabled={claimed}
                  className="px-4 h-9 rounded-xl text-[11px] font-black tracking-wider uppercase transition-all active:scale-95 flex items-center gap-1.5"
                  style={
                    claimed
                      ? { background: 'rgba(16,185,129,0.12)', color: '#34D399', border: '1px solid rgba(16,185,129,0.3)' }
                      : { background: '#F59E0B', color: '#000', boxShadow: '0 4px 16px rgba(245,158,11,0.3)' }
                  }
                >
                  {claimed ? (<><Check className="w-3 h-3" /> Claimed</>) : 'Claim'}
                </button>
              </motion.div>

              {/* Continue */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={() => setShow(false)}
                className="mt-5 w-full h-12 rounded-2xl text-[13px] font-bold text-white transition-all active:scale-[0.98]"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                Enter Loopgate
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
