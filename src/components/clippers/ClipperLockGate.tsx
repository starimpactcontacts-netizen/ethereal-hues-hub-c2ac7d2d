import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, X, ArrowRight, Lock, Zap, Copy, Check, AlertTriangle, Eye, EyeOff, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

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
  const [agreed, setAgreed] = useState(false);
  const [agreeError, setAgreeError] = useState(false);
  const [isFastPassword, setIsFastPassword] = useState(false);
  const [savedAck, setSavedAck] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remembered, setRemembered] = useState<{ handle: string; password: string; email: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem('loopgate_clipper_login');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.handle && parsed?.password && parsed?.email) setRemembered(parsed);
      }
    } catch {/* ignore */}
  }, [open]);

  const oneTapSignIn = async () => {
    if (!remembered) return;
    setLoading(true);
    try {
      let { error } = await supabase.auth.signInWithPassword({
        email: remembered.email,
        password: remembered.password,
      });
      if (error && /confirm/i.test(error.message)) {
        await supabase.functions.invoke('auto-confirm-user', { body: { email: remembered.email } });
        ({ error } = await supabase.auth.signInWithPassword({
          email: remembered.email,
          password: remembered.password,
        }));
      }
      if (error) throw error;
      toast.success(`Welcome back, @${remembered.handle}`);
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || 'One-tap sign-in failed');
      try { localStorage.removeItem('loopgate_clipper_login'); } catch {/* ignore */}
      setRemembered(null);
    } finally {
      setLoading(false);
    }
  };

  const generateFastPassword = () => {
    const words = ['loop','edit','wave','beat','flame','tiger','neon','rapid','pulse','storm','blaze','swift','cobra','vortex','echo','bolt','shadow','rogue'];
    const w1 = words[Math.floor(Math.random() * words.length)];
    const w2 = words[Math.floor(Math.random() * words.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    setPassword(`${w1}-${w2}-${num}`);
    setIsFastPassword(true);
    setSavedAck(false);
    setCopied(false);
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      toast.success('Password copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy');
    }
  };

  // Hide clipper top bar + bottom nav while gate is open
  useEffect(() => {
    if (!open) return;
    const header = document.querySelector('[data-clippers-header]') as HTMLElement | null;
    const nav = document.querySelector('[data-clippers-bottom-nav]') as HTMLElement | null;
    const prevHeader = header?.style.display;
    const prevNav = nav?.style.display;
    if (header) header.style.display = 'none';
    if (nav) nav.style.display = 'none';
    return () => {
      if (header) header.style.display = prevHeader || '';
      if (nav) nav.style.display = prevNav || '';
    };
  }, [open]);

  const submit = async () => {
    setErr('');
    setAgreeError(false);
    if (!username || username.length < 3) {
      setErr('Username must be at least 3 characters');
      return;
    }
    if (!password || password.length < 6) {
      setErr('Password must be at least 6 characters');
      return;
    }
    if (!agreed) {
      setAgreeError(true);
      setErr('Please confirm you’re 18+ and have read the mission policy');
      return;
    }
    if (isFastPassword && !savedAck) {
      setErr('Please confirm you saved your password');
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
      // Ensure we have an active session before doing any RLS-protected writes.
      // (If email confirmation was on, signUp returns no session.)
      if (!data.session) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: fakeEmail,
          password,
        });
        if (signInErr) {
          setErr('Account created but sign-in failed. Try logging in.');
          return;
        }
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
      try {
        localStorage.setItem('loopgate_clipper_login', JSON.stringify({ handle, password, email: fakeEmail }));
      } catch {/* ignore */}
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
              {remembered && (
                <button
                  type="button"
                  onClick={oneTapSignIn}
                  disabled={loading}
                  className="w-full mb-5 rounded-[14px] p-3 flex items-center gap-3 active:opacity-70 disabled:opacity-50 transition-opacity"
                  style={{ background: 'rgba(212, 168, 87, 0.10)', border: '0.5px solid rgba(212, 168, 87, 0.45)' }}
                >
                  <div className="w-9 h-9 rounded-full bg-[#D4A857] flex items-center justify-center shrink-0">
                    <UserCheck className="w-4 h-4 text-black" strokeWidth={2.4} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-[#D4A857] font-semibold">One-tap sign in</div>
                    <div className="text-[14px] text-white font-medium truncate">Continue as @{remembered.handle}</div>
                  </div>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin text-white/70" /> : <ArrowRight className="w-4 h-4 text-[#D4A857]" />}
                </button>
              )}

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
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type={isFastPassword || showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (isFastPassword) setIsFastPassword(false); }}
                      placeholder="Password"
                      className="h-12 bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.06] focus:bg-white/[0.06] focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:ring-offset-0 rounded-xl text-[15px] text-white placeholder:text-white/25 transition-colors pr-20"
                      style={{ fontFamily: isFastPassword ? 'ui-monospace, SFMono-Regular, monospace' : undefined, letterSpacing: isFastPassword ? '0.02em' : undefined }}
                      onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-[8px] bg-white/[0.08] active:bg-white/[0.16] flex items-center justify-center"
                      style={isFastPassword ? { right: '2.75rem' } : undefined}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 text-white/80" /> : <Eye className="w-4 h-4 text-white/80" />}
                    </button>
                    {isFastPassword && (
                      <button
                        type="button"
                        onClick={copyPassword}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-[8px] bg-white/[0.08] active:bg-white/[0.16] flex items-center justify-center"
                      >
                        {copied ? <Check className="w-4 h-4 text-[#30D158]" /> : <Copy className="w-4 h-4 text-white/80" />}
                      </button>
                    )}
                  </div>

                  {!isFastPassword && (
                    <button
                      type="button"
                      onClick={generateFastPassword}
                      className="flex items-center gap-1.5 text-[12px] font-semibold text-[#D4A857] active:opacity-60 px-1"
                    >
                      <Zap className="w-3 h-3 fill-[#D4A857]" />
                      Use fast password
                    </button>
                  )}

                  {isFastPassword && (
                    <div className="rounded-[12px] p-3 space-y-2.5" style={{ background: 'rgba(212, 168, 87, 0.10)', border: '0.5px solid rgba(212, 168, 87, 0.35)' }}>
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-[#D4A857] shrink-0 mt-0.5" />
                        <p className="text-[12px] leading-snug text-white/90">
                          <span className="font-semibold">Save this password now.</span> Screenshot it or copy it — you'll need it to log back in.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSavedAck(v => !v)}
                        className="w-full flex items-center gap-2 active:opacity-60"
                      >
                        <span className={`w-[18px] h-[18px] rounded-[5px] flex items-center justify-center shrink-0 transition-colors ${
                          savedAck ? 'bg-[#D4A857] border border-[#D4A857]' : 'bg-white/[0.04] border border-white/20'
                        }`}>
                          {savedAck && (
                            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                              <path d="M1.5 5.5L4.5 8.5L9.5 2.5" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                        <span className="text-[12px] text-white/85 text-left">
                          I saved my password (screenshot or copy)
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {err && (
                  <p className="text-[12px] text-red-400/90 px-1 pt-1">{err}</p>
                )}

                <button
                  type="button"
                  onClick={() => { setAgreed((v) => !v); setAgreeError(false); }}
                  className="w-full flex items-start gap-2.5 px-1 pt-2 text-left"
                >
                  <span
                    className={`mt-0.5 w-[18px] h-[18px] rounded-[5px] flex items-center justify-center shrink-0 transition-colors ${
                      agreed
                        ? 'bg-[#0A84FF] border border-[#0A84FF]'
                        : agreeError
                          ? 'bg-transparent border border-red-500/80'
                          : 'bg-white/[0.04] border border-white/15'
                    }`}
                  >
                    {agreed && (
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                        <path d="M1.5 5.5L4.5 8.5L9.5 2.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className={`text-[12px] leading-snug ${agreeError ? 'text-red-400/90' : 'text-white/55'}`}>
                    I’m 18+ and have read the{' '}
                    <Link
                      to="/missions/policy"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[#0A84FF] hover:underline"
                    >
                      mission policy
                    </Link>
                    .
                  </span>
                </button>

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