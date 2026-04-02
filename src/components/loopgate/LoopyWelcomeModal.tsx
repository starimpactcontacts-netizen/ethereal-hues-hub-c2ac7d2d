import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  const handleAskLoopy = () => {
    setShow(false);
    // Trigger Loopy chat open via custom event
    window.dispatchEvent(new CustomEvent('open-loopy-chat'));
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
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShow(false)} />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.1 }}
            className="relative w-full max-w-sm rounded-2xl border border-border bg-card overflow-hidden"
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

            {/* Glow top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

            {/* Content */}
            <div className="relative p-6 pt-5 text-center space-y-4">
              {/* Loopy mascot */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="relative mx-auto w-36 h-36"
              >
                <motion.img
                  src={loopyWelcome}
                  alt="Loopy"
                  className="w-full h-full object-contain drop-shadow-2xl"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                />
                {/* Sparkles */}
                {[
                  { top: '10%', left: '5%', delay: 0 },
                  { top: '5%', right: '10%', delay: 0.3 },
                  { bottom: '20%', left: '0%', delay: 0.6 },
                  { bottom: '15%', right: '5%', delay: 0.9 },
                ].map((pos, i) => (
                  <motion.span
                    key={i}
                    className="absolute text-amber-400 text-sm"
                    style={pos}
                    animate={{ 
                      opacity: [0, 1, 0], 
                      scale: [0.5, 1.2, 0.5],
                      rotate: [0, 180, 360],
                    }}
                    transition={{ repeat: Infinity, duration: 2, delay: pos.delay }}
                  >
                    ✦
                  </motion.span>
                ))}
              </motion.div>

              {/* Text */}
              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="space-y-2"
              >
                <h2 className="font-display text-2xl text-foreground tracking-wide">
                  YO WSG, {profile?.username?.toUpperCase() || 'EDITOR'}!
                </h2>
                <div className="space-y-1.5">
                  <p className="text-sm text-muted-foreground">
                    You just became <span className="text-amber-400 font-bold">#{ogNumber?.toLocaleString()}</span> OG Editor in Loopgate! 🏆
                  </p>
                  <p className="text-xs text-muted-foreground/80 leading-relaxed">
                    Make yourself comfy — grab a <span className="text-foreground font-medium">First Circle Badge</span> from your inventory. Wear it, flex it, or hide it… your choice.
                  </p>
                </div>
              </motion.div>

              {/* Badge preview */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.7, type: 'spring' }}
                className="flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-primary/10 border border-amber-500/20"
              >
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="text-2xl"
                >
                  🏅
                </motion.div>
                <div className="text-left">
                  <p className="text-xs font-bold text-foreground">First Circle Badge</p>
                  <p className="text-[10px] text-amber-400/80">OG — Limited Edition</p>
                </div>
                <button
                  onClick={handleClaim}
                  className="ml-auto px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-black text-xs font-bold hover:from-amber-400 hover:to-amber-500 transition-all active:scale-95"
                >
                  Claim
                </button>
              </motion.div>

              {/* Loopy CTA */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="space-y-2 pt-1"
              >
                <p className="text-[10px] text-muted-foreground">
                  Need a nudge to start? 👇
                </p>
                <button
                  onClick={handleAskLoopy}
                  className="w-full py-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all text-sm font-medium text-foreground flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    🐱
                  </motion.span>
                  Ask Loopy Anything
                </button>
              </motion.div>

              {/* Skip */}
              <button
                onClick={() => setShow(false)}
                className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              >
                skip for now
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
