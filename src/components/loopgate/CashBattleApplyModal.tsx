import { useState } from 'react';
import { X, DollarSign, Shield, Zap, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMyCashBattleApplication } from '@/hooks/useCashBattles';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CashBattleApplyModal({ open, onClose }: Props) {
  const { application, joinPool } = useMyCashBattleApplication();
  const [joining, setJoining] = useState(false);
  const [justJoined, setJustJoined] = useState(false);

  const alreadyIn = !!application;

  async function handleJoin() {
    setJoining(true);
    const ok = await joinPool();
    setJoining(false);
    if (ok) setJustJoined(true);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: '#111', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            {/* Header */}
            <div className="relative px-5 pt-5 pb-2">
              <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white flex items-center justify-center">
                <X className="w-4 h-4 text-black" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #ef4444)' }}>
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-wider" style={{ fontFamily: 'Teko, sans-serif' }}>
                    Cash Battles
                  </h2>
                  <p className="text-[10px] uppercase tracking-wider" style={{ fontFamily: 'Teko, sans-serif', color: 'rgba(239,68,68,0.6)' }}>
                    1v1 Edit Battle — Winner takes cash
                  </p>
                </div>
              </div>
            </div>

            {alreadyIn || justJoined ? (
              <div className="px-5 pb-6 pt-3">
                <div className="rounded-xl p-5 text-center" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#3b82f6' }} />
                  <p className="text-sm font-bold uppercase" style={{ fontFamily: 'Teko, sans-serif', color: '#3b82f6' }}>
                    You're In
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    You're in the fighter pool. When a match is set up, you'll be notified in <span className="text-amber-400 font-semibold">My Arena</span>.
                  </p>
                </div>
              </div>
            ) : (
              <div className="px-5 pb-5 pt-2 space-y-4">
                {/* Rules — super simple */}
                <div className="space-y-2 text-[11px] text-zinc-400 leading-relaxed">
                  <p>⚡ Join the fighter pool with one tap. When it's time, you get matched 1v1.</p>
                  <p>🎬 Use the sponsor's scenepack to make your edit. Submit before the clock runs out.</p>
                  <p>💰 Winner takes the full cash prize. Go viral (100k+ views) and earn up to <span className="text-emerald-400 font-bold">$50 bonus</span>.</p>
                </div>

                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="w-full py-3 rounded-xl text-white font-black uppercase tracking-wider disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  style={{
                    fontFamily: 'Teko, sans-serif',
                    fontSize: '16px',
                    background: 'linear-gradient(135deg, #3b82f6, #ef4444)',
                  }}
                >
                  <Zap className="w-4 h-4" />
                  {joining ? 'Joining...' : 'JOIN'}
                </button>

                <p className="text-[9px] text-zinc-600 text-center">
                  By joining you confirm your edits are original & you're ready to compete.
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
