import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import authCollageBg from '@/assets/auth-collage-bg.jpg';
import loopgateIcon from '@/assets/loopgate-logo.png';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  // Supabase sends the recovery token via URL hash; the SDK fires
  // PASSWORD_RECOVERY once it processes the hash.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    // Also accept if user already has an active session from the link
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) {
      toast.error(error.message || 'Could not update password');
      return;
    }
    toast.success('Password updated — you are logged in');
    navigate('/hub');
  };

  return (
    <div className="fixed inset-0 overflow-hidden font-apple">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#0A0A0A]" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-55"
          style={{ backgroundImage: `url(${authCollageBg})` }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.7) 100%)' }} />
        <div className="absolute inset-0 backdrop-blur-2xl" style={{ background: 'rgba(8,8,10,0.35)' }} />
      </div>

      {/* Top bar */}
      <div
        className="absolute top-0 inset-x-0 z-20 flex items-center px-5"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 14px)' }}
      >
        <button
          onClick={() => navigate('/login')}
          className="h-9 w-9 rounded-full flex items-center justify-center bg-white/[0.08] backdrop-blur-xl border border-white/10 active:scale-95 transition"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4 text-white" />
        </button>
      </div>

      <main
        className="absolute inset-0 overflow-y-auto overscroll-contain"
        style={{
          WebkitOverflowScrolling: 'touch',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 72px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
        }}
      >
        <div className="px-5 mx-auto w-full max-w-[420px]">
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-[28px] overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(28,28,30,0.72) 0%, rgba(20,20,22,0.62) 100%)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 30px 80px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            <div className="px-6 pt-7 pb-6">
              <div className="mb-6">
                <img
                  src={loopgateIcon}
                  alt="Loopgate"
                  className="h-12 w-12 mb-4 rounded-[12px] object-contain"
                  style={{ filter: 'drop-shadow(0 8px 20px rgba(212,168,87,0.35))' }}
                />
                <p className="text-[11px] font-semibold tracking-[0.22em] text-[#D4A857] uppercase mb-2">
                  Reset Password
                </p>
                <h1 className="text-white text-[34px] leading-[1.05] font-bold tracking-[-0.03em]">
                  New password.
                </h1>
                <p className="text-white/55 text-[14px] mt-2 leading-snug tracking-[-0.01em]">
                  {ready
                    ? 'Choose a new password for your account.'
                    : 'Opening your reset link…'}
                </p>
              </div>

              {ready ? (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[13px] text-[#8E8E93] font-medium px-1">New password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                      <Input
                        type={showNew ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="6+ characters"
                        autoComplete="new-password"
                        autoFocus
                        className="pl-10 pr-11 h-12 rounded-[12px] border-0 text-[16px] text-white placeholder:text-white/35 focus-visible:ring-1 focus-visible:ring-[#D4A857]"
                        style={{ background: 'rgba(118, 118, 128, 0.24)' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-[8px] bg-white/[0.06] active:bg-white/[0.16] flex items-center justify-center"
                      >
                        {showNew ? <EyeOff className="h-4 w-4 text-white/80" /> : <Eye className="h-4 w-4 text-white/80" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] text-[#8E8E93] font-medium px-1">Confirm password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                      <Input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="pl-10 pr-11 h-12 rounded-[12px] border-0 text-[16px] text-white placeholder:text-white/35 focus-visible:ring-1 focus-visible:ring-[#D4A857]"
                        style={{ background: 'rgba(118, 118, 128, 0.24)' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-[8px] bg-white/[0.06] active:bg-white/[0.16] flex items-center justify-center"
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4 text-white/80" /> : <Eye className="h-4 w-4 text-white/80" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !newPassword || !confirmPassword}
                    className="w-full h-12 rounded-[14px] bg-[#D4A857] text-white text-[17px] font-semibold active:opacity-60 disabled:opacity-50 flex items-center justify-center mt-1"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update password'}
                  </button>
                </form>
              ) : (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
