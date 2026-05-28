import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Zap, Copy, Check, AlertTriangle, Eye, EyeOff, UserCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTempProfile } from '@/hooks/useTempProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

interface AccountPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: string;
  onSuccess?: () => void;
}

export default function AccountPromptModal({ isOpen, onClose, reason, onSuccess }: AccountPromptModalProps) {
  const { profile: tempProfile, clearProfile } = useTempProfile();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState(''); // username for signup, email/username for login
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [agreed, setAgreed] = useState(false);
  const [agreeError, setAgreeError] = useState(false);
  const [isFastPassword, setIsFastPassword] = useState(false);
  const [savedAck, setSavedAck] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remembered, setRemembered] = useState<{ identifier: string; password: string } | null>(null);

  // Load remembered credentials for one-tap sign-in
  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem('loopgate_last_login');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.identifier && parsed?.password) {
          setRemembered(parsed);
        }
      }
    } catch {/* ignore */}
  }, [isOpen]);

  const rememberLogin = (identifier: string, password: string) => {
    try {
      localStorage.setItem('loopgate_last_login', JSON.stringify({ identifier, password }));
    } catch {/* ignore */}
  };

  const oneTapSignIn = async () => {
    if (!remembered) return;
    setLoading(true);
    try {
      const idVal = remembered.identifier.trim();
      let loginEmail = idVal;
      const isEmail = loginEmail.includes('@') && loginEmail.includes('.') && !loginEmail.endsWith('@user.loopgate.gg') && !loginEmail.endsWith('@user.loopgate.io');
      if (!isEmail && !loginEmail.includes('@')) {
        const uname = loginEmail.replace(/^@/, '').toLowerCase();
        const { data: profileRow } = await supabase
          .from('profiles')
          .select('email')
          .ilike('username', uname)
          .maybeSingle();
        loginEmail = profileRow?.email || `${uname}@user.loopgate.gg`;
      }
      let { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: remembered.password,
      });
      if (error && /confirm/i.test(error.message)) {
        await supabase.functions.invoke('auto-confirm-user', { body: { email: loginEmail } });
        ({ error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: remembered.password,
        }));
      }
      if (error) throw error;
      toast.success(`Welcome back, @${remembered.identifier.replace(/^@/, '')}`);
      onClose();
      onSuccess?.();
    } catch (e: any) {
      toast.error(e.message || 'One-tap sign-in failed');
      try { localStorage.removeItem('loopgate_last_login'); } catch {/* ignore */}
      setRemembered(null);
    } finally {
      setLoading(false);
    }
  };

  const generateFastPassword = () => {
    // Memorable & strong: word-word-#### (e.g. tiger-loop-4829)
    const words = ['loop','edit','wave','beat','flame','tiger','neon','rapid','pulse','storm','blaze','swift','cobra','vortex','echo','bolt','shadow','rogue'];
    const w1 = words[Math.floor(Math.random() * words.length)];
    const w2 = words[Math.floor(Math.random() * words.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    const pw = `${w1}-${w2}-${num}`;
    setPassword(pw);
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

  const handleSubmit = async () => {
    const idVal = identifier.trim();
    if (!idVal || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (mode === 'signup' && !agreed) {
      setAgreeError(true);
      toast.error('Please confirm you’re 13+ and have read the terms');
      return;
    }
    if (mode === 'signup' && isFastPassword && !savedAck) {
      toast.error('Please confirm you saved your password');
      return;
    }
    setAgreeError(false);

    setLoading(true);

    try {
      if (mode === 'signup') {
        // Username-based signup. We synthesize an internal email so Supabase Auth still works.
        const cleanUsername = idVal.replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_]/g, '');
        if (cleanUsername.length < 3) {
          throw new Error('Username must be at least 3 characters (a-z, 0-9, _)');
        }
        // Check availability
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .ilike('username', cleanUsername)
          .maybeSingle();
        if (existing?.id) {
          throw new Error('That username is taken');
        }
        const synthEmail = `${cleanUsername}@user.loopgate.gg`;
        const { data, error } = await supabase.auth.signUp({
          email: synthEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              username: cleanUsername,
              region: tempProfile?.region,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          await supabase
            .from('profiles')
            .update({
              username: cleanUsername,
              region: tempProfile?.region,
              onboarding_completed: true,
            })
            .eq('id', data.user.id);

          clearProfile();
          rememberLogin(cleanUsername, password);
          toast.success('Account created! Welcome to Loopgate.');
          onClose();
          onSuccess?.();
        }
      } else {
        // Login — accept email OR username
        let loginEmail = idVal;
        const isEmail = loginEmail.includes('@') && loginEmail.includes('.');
        if (!isEmail) {
          // Treat as username (strip leading @ if present)
          const uname = loginEmail.replace(/^@/, '').toLowerCase();
          // Try profile email first; fall back to synthesized internal email
          const { data: profileRow } = await supabase
            .from('profiles')
            .select('email')
            .ilike('username', uname)
            .maybeSingle();
          if (profileRow?.email) {
            loginEmail = profileRow.email;
          } else {
            loginEmail = `${uname}@user.loopgate.gg`;
          }
        }
        let { error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password,
        });
        if (error && /confirm/i.test(error.message)) {
          await supabase.functions.invoke('auto-confirm-user', { body: { email: loginEmail } });
          ({ error } = await supabase.auth.signInWithPassword({
            email: loginEmail,
            password,
          }));
        }
        if (error) throw error;

        clearProfile();
        rememberLogin(idVal, password);
        toast.success('Welcome back!');
        onClose();
        onSuccess?.();
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center font-apple"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md rounded-t-[20px] sm:rounded-[20px] flex flex-col"
            style={{ background: '#1c1c1e', maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - 16px)' }}
          >
            {/* Header */}
            <div className="px-5 pt-3 pb-3 shrink-0 relative">
              <div className="w-9 h-1 rounded-full bg-white/25 mx-auto sm:hidden mb-4" />
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.14] active:bg-white/[0.2] flex items-center justify-center transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
              </button>
              <h2 className="text-[22px] font-bold text-white tracking-[-0.022em] pr-10 pt-1">
                {mode === 'signup' ? 'Save your progress' : 'Welcome back'}
              </h2>
              <p className="text-[14px] text-[#8E8E93] mt-1 leading-snug">
                {mode === 'signup' ? 'Pick a username & password — done in 5 seconds.' : reason}
              </p>
            </div>

            {/* Content */}
            <div
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-4"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {remembered && (
                <button
                  type="button"
                  onClick={oneTapSignIn}
                  disabled={loading}
                  className="w-full rounded-[14px] p-3 flex items-center gap-3 active:opacity-70 disabled:opacity-50 transition-opacity"
                  style={{ background: 'rgba(10, 132, 255, 0.12)', border: '0.5px solid rgba(10, 132, 255, 0.45)' }}
                >
                  <div className="w-9 h-9 rounded-full bg-[#0A84FF] flex items-center justify-center shrink-0">
                    <UserCheck className="w-4 h-4 text-white" strokeWidth={2.4} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-[11px] uppercase tracking-wider text-[#0A84FF] font-semibold">One-tap sign in</div>
                    <div className="text-[14px] text-white font-medium truncate">Continue as @{remembered.identifier.replace(/^@/, '')}</div>
                  </div>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin text-white/70" /> : <span className="text-[#0A84FF] text-[13px] font-semibold">Tap →</span>}
                </button>
              )}

              <div className="space-y-1.5">
                <label className="text-[13px] text-[#8E8E93] font-medium px-1">
                  {mode === 'signup' ? 'Username' : 'Username or email'}
                </label>
                <Input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={mode === 'signup' ? '@yourname' : '@username or email'}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  className="h-11 rounded-[10px] border-0 text-[16px] text-white placeholder:text-[#8E8E93] focus-visible:ring-1 focus-visible:ring-[#D4A857]"
                  style={{ background: 'rgba(118, 118, 128, 0.24)' }}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[13px] text-[#8E8E93] font-medium">Password</label>
                  {mode === 'signup' && !isFastPassword && (
                    <button
                      type="button"
                      onClick={generateFastPassword}
                      className="flex items-center gap-1 text-[12px] font-semibold text-[#D4A857] active:opacity-60"
                    >
                      <Zap className="w-3 h-3 fill-[#D4A857]" />
                      Use fast password
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    type={isFastPassword || showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (isFastPassword) setIsFastPassword(false); }}
                    placeholder="••••••••"
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    autoCapitalize="none"
                    spellCheck={false}
                    className="h-11 rounded-[10px] border-0 text-[16px] text-white placeholder:text-[#8E8E93] focus-visible:ring-1 focus-visible:ring-[#D4A857] pr-20"
                    style={{ background: 'rgba(118, 118, 128, 0.24)', fontFamily: isFastPassword ? 'ui-monospace, SFMono-Regular, monospace' : undefined, letterSpacing: isFastPassword ? '0.02em' : undefined }}
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

                {mode === 'signup' && isFastPassword && (
                  <div className="mt-2 rounded-[12px] p-3 space-y-2.5" style={{ background: 'rgba(212, 168, 87, 0.10)', border: '0.5px solid rgba(212, 168, 87, 0.35)' }}>
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

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full h-12 rounded-[14px] bg-[#D4A857] text-white text-[17px] font-semibold active:opacity-60 disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === 'signup' ? 'Create account' : 'Sign in'}
              </button>

              {mode === 'signup' && (
                <button
                  type="button"
                  onClick={() => { setAgreed((v) => !v); setAgreeError(false); }}
                  className="w-full flex items-start gap-2.5 px-1 text-left"
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
                  <span className={`text-[12px] leading-snug ${agreeError ? 'text-red-400/90' : 'text-[#8E8E93]'}`}>
                    I’m 13+ and have read the{' '}
                    <Link
                      to="/rules"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[#0A84FF] hover:underline"
                    >
                      Loopgate terms
                    </Link>
                    .
                  </span>
                </button>
              )}

              <button
                onClick={() => {
                  if (mode === 'signup') {
                    onClose();
                    navigate('/login');
                  } else {
                    setMode('signup');
                  }
                }}
                className="w-full h-11 text-[14px] text-[#8E8E93] active:opacity-60"
              >
                {mode === 'signup' ? (
                  <>Already have an account? <span className="text-[#0A84FF] font-medium">Sign in</span></>
                ) : (
                  <>Need an account? <span className="text-[#0A84FF] font-medium">Sign up</span></>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
