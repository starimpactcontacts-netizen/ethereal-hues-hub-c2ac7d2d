import { useState } from 'react';
import { X, DollarSign, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { useMyCashBattleApplication } from '@/hooks/useCashBattles';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CashBattleApplyModal({ open, onClose }: Props) {
  const { application, submitApplication } = useMyCashBattleApplication();
  const [demoUrl, setDemoUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const alreadyApplied = !!application;

  async function handleSubmit() {
    if (!demoUrl || !tiktokUrl || !agreed) return;
    setSubmitting(true);
    const ok = await submitApplication({
      demo_reel_url: demoUrl,
      tiktok_url: tiktokUrl,
    });
    setSubmitting(false);
    if (ok) onClose();
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
            style={{ background: '#111', border: '1px solid rgba(212,175,55,0.2)' }}
          >
            {/* Header */}
            <div className="relative px-5 pt-5 pb-2">
              <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white flex items-center justify-center">
                <X className="w-4 h-4 text-black" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #d4af37, #b8960c)' }}>
                  <DollarSign className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-wider" style={{ fontFamily: 'Teko, sans-serif' }}>
                    Apply to Compete
                  </h2>
                  <p className="text-[10px] uppercase tracking-wider" style={{ fontFamily: 'Teko, sans-serif', color: 'rgba(212,175,55,0.6)' }}>
                    Cash Battle Application
                  </p>
                </div>
              </div>
            </div>

            {alreadyApplied ? (
              <div className="px-5 pb-6 pt-2">
                <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
                  <Shield className="w-8 h-8 mx-auto mb-2" style={{ color: '#d4af37' }} />
                  <p className="text-sm font-bold uppercase" style={{ fontFamily: 'Teko, sans-serif', color: '#d4af37' }}>
                    {application.status === 'pending' ? 'Under Review' : application.status.toUpperCase()}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    {application.status === 'pending'
                      ? "We're reviewing your profile. You'll be notified when matched."
                      : application.status === 'approved'
                      ? "You're approved! Waiting for matchmaking."
                      : "Check back later for updates."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="px-5 pb-5 pt-1 space-y-3">
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Show us your best edit and your TikTok. We handpick the most exciting matchups.
                </p>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1" style={{ fontFamily: 'Teko, sans-serif' }}>Your Best Edit *</label>
                  <Input
                    placeholder="Link to your best edit (TikTok, YT, IG)"
                    value={demoUrl}
                    onChange={e => setDemoUrl(e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1" style={{ fontFamily: 'Teko, sans-serif' }}>TikTok Profile *</label>
                  <Input
                    placeholder="https://tiktok.com/@yourhandle"
                    value={tiktokUrl}
                    onChange={e => setTiktokUrl(e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-xs"
                  />
                </div>

                {/* Legal agreement */}
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                    className="mt-0.5 accent-yellow-600"
                  />
                  <span className="text-[10px] text-zinc-400 leading-relaxed">
                    I confirm I'm eligible to compete, my work is original, and I agree to competition rules. Matches are curated by Loopgate for fairness.
                  </span>
                </label>

                <button
                  onClick={handleSubmit}
                  disabled={!demoUrl || !tiktokUrl || !agreed || submitting}
                  className="w-full py-3 rounded-xl text-black font-black uppercase tracking-wider disabled:opacity-30 transition-all"
                  style={{
                    fontFamily: 'Teko, sans-serif',
                    fontSize: '16px',
                    background: demoUrl && tiktokUrl && agreed ? 'linear-gradient(135deg, #d4af37, #b8960c)' : '#333',
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
