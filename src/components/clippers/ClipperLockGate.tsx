import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, X, ArrowRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  reason?: string;
}

/**
 * Frictionless clipper lock-in.
 * Just username + password. Email & socials go in settings later.
 */
export default function ClipperLockGate({ open, onClose, onSuccess, reason }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    setErr('');
    if (!username || username.length < 3) {
      setErr('Username must be at least 3 characters');
      return;
    }
    if (!password || password.length < 6) {
      setErr('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const handle = username.toUpperCase().replace(/[^A-Z0-9_]/g, '');
      const fakeEmail = `${handle.toLowerCase()}_clipper_${Date.now()}@loopgate.clip`;
      const { data, error } = await supabase.auth.signUp({
        email: fakeEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/missions/portal`,
          data: { username: handle },
        },
      });
      if (error) {
        setErr(error.message);
        return;
      }
      const uid = data.user?.id;
      if (!uid) {
        setErr('Could not create account.');
        return;
      }
      await supabase.from('profiles').upsert({
        id: uid,
        username: handle,
        rules_accepted: true,
        onboarding_completed: true,
      });
      await supabase.from('clipper_profiles').upsert({
        user_id: uid,
        display_name: handle,
        agreed_to_terms: true,
        age_confirmed_18_plus: true,
        agreed_30_day_post: true,
      });
      await supabase.from('user_roles').insert({
        user_id: uid,
        role: 'clipper' as never,
      } as never);
      toast.success(`Welcome, @${handle}`);
      onSuccess();
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xl p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-[380px] relative overflow-hidden sm:rounded-[28px] rounded-t-[28px] pb-[max(1.75rem,env(safe-area-inset-bottom))]"
            style={{
              background: 'linear-gradient(180deg, hsl(0 0% 9%) 0%, hsl(0 0% 6%) 100%)',
              boxShadow: '0 30px 80px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06) inset',
            }}
          >
            {/* Subtle top highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white/60 hover:text-white transition-colors z-10"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>

            <div className="px-7 pt-9">
              {/* Icon */}
              <div className="flex justify-center mb-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, hsl(0 0% 18%) 0%, hsl(0 0% 10%) 100%)',
                    boxShadow: '0 8px 24px -8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
                  }}
                >
                  <Lock className="w-5 h-5 text-white" strokeWidth={2.2} />
                </div>
              </div>

              <h2 className="text-[22px] font-semibold text-white text-center tracking-[-0.02em] mb-1.5">
                Create your account
              </h2>
              <p className="text-[13px] text-white/50 text-center mb-7 leading-relaxed px-2">
                {reason || 'Pick a handle to save your progress and receive payouts.'}
              </p>

              <div className="space-y-2.5">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] text-white/30 pointer-events-none">@</span>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toUpperCase())}
                    placeholder="handle"
                    maxLength={20}
                    className="h-12 pl-9 bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.06] focus:bg-white/[0.06] focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:ring-offset-0 rounded-xl text-[15px] uppercase tracking-wide text-white placeholder:text-white/25 placeholder:normal-case placeholder:tracking-normal transition-colors"
                    autoFocus
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="h-12 bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.06] focus:bg-white/[0.06] focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:ring-offset-0 rounded-xl text-[15px] text-white placeholder:text-white/25 transition-colors"
                    onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
                  />
                </div>

                {err && (
                  <p className="text-[12px] text-red-400/90 px-1 pt-1">{err}</p>
                )}

                <Button
                  onClick={submit}
                  disabled={loading}
                  className="w-full h-12 mt-3 bg-white hover:bg-white/95 text-black font-medium text-[15px] rounded-xl transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-1.5">
                      Continue <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                    </span>
                  )}
                </Button>

                <p className="text-[11px] text-white/30 text-center pt-3 leading-relaxed">
                  Add email & socials anytime in Settings.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}