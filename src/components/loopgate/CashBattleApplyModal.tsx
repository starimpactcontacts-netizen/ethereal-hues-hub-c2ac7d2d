import { useState } from 'react';
import { X, DollarSign, Shield, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { useMyCashBattleApplication } from '@/hooks/useCashBattles';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CashBattleApplyModal({ open, onClose }: Props) {
  const { application, submitApplication } = useMyCashBattleApplication();
  const [form, setForm] = useState({
    tiktok_url: '',
    instagram_url: '',
    youtube_url: '',
    demo_reel_url: '',
    pitch: '',
  });
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const alreadyApplied = !!application;

  async function handleSubmit() {
    if (!form.demo_reel_url || !agreed) return;
    setSubmitting(true);
    const ok = await submitApplication(form);
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
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md mx-4 rounded-t-2xl sm:rounded-2xl overflow-hidden"
            style={{ background: '#111', border: '1px solid rgba(16,185,129,0.2)' }}
          >
            {/* Header */}
            <div className="relative px-5 pt-5 pb-3">
              <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <X className="w-4 h-4 text-white" />
              </button>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-wider" style={{ fontFamily: 'Teko, sans-serif' }}>
                    Apply to Compete
                  </h2>
                  <p className="text-[10px] text-emerald-500/60 uppercase tracking-wider" style={{ fontFamily: 'Teko, sans-serif' }}>
                    Cash Battle Application
                  </p>
                </div>
              </div>
            </div>

            {alreadyApplied ? (
              <div className="px-5 pb-6">
                <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <Shield className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-emerald-400 uppercase" style={{ fontFamily: 'Teko, sans-serif' }}>
                    Application {application.status === 'pending' ? 'Under Review' : application.status.toUpperCase()}
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
              <div className="px-5 pb-5 space-y-3 max-h-[60vh] overflow-y-auto">
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Submit your best work and socials. Our team handpicks opponents for the fairest, most exciting matchups. Only serious competitors.
                </p>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1" style={{ fontFamily: 'Teko, sans-serif' }}>Demo Reel URL *</label>
                  <Input
                    placeholder="Link to your best edit (TikTok, YT, IG)"
                    value={form.demo_reel_url}
                    onChange={e => setForm({ ...form, demo_reel_url: e.target.value })}
                    className="bg-white/5 border-white/10 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1" style={{ fontFamily: 'Teko, sans-serif' }}>TikTok Profile</label>
                  <Input
                    placeholder="https://tiktok.com/@yourhandle"
                    value={form.tiktok_url}
                    onChange={e => setForm({ ...form, tiktok_url: e.target.value })}
                    className="bg-white/5 border-white/10 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1" style={{ fontFamily: 'Teko, sans-serif' }}>Instagram Profile</label>
                  <Input
                    placeholder="https://instagram.com/yourhandle"
                    value={form.instagram_url}
                    onChange={e => setForm({ ...form, instagram_url: e.target.value })}
                    className="bg-white/5 border-white/10 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1" style={{ fontFamily: 'Teko, sans-serif' }}>YouTube Channel</label>
                  <Input
                    placeholder="https://youtube.com/@yourhandle"
                    value={form.youtube_url}
                    onChange={e => setForm({ ...form, youtube_url: e.target.value })}
                    className="bg-white/5 border-white/10 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1" style={{ fontFamily: 'Teko, sans-serif' }}>Why should you compete? (optional)</label>
                  <textarea
                    placeholder="Tell us about your editing style and why you'd make an exciting fighter..."
                    value={form.pitch}
                    onChange={e => setForm({ ...form, pitch: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-md text-white text-xs p-3 resize-none h-20 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                  />
                </div>

                {/* Legal agreement */}
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                    className="mt-0.5 accent-emerald-500"
                  />
                  <span className="text-[10px] text-zinc-400 leading-relaxed">
                    I confirm I am eligible to compete, my submitted work is original, and I agree to the platform's competition rules and terms of service. I understand matches are curated by the Loopgate team for fairness.
                  </span>
                </label>

                <button
                  onClick={handleSubmit}
                  disabled={!form.demo_reel_url || !agreed || submitting}
                  className="w-full py-3.5 rounded-xl text-black font-black text-sm uppercase tracking-wider disabled:opacity-40 transition-all"
                  style={{
                    fontFamily: 'Teko, sans-serif',
                    fontSize: '16px',
                    background: agreed && form.demo_reel_url ? 'linear-gradient(135deg, #10b981, #059669)' : '#333',
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
