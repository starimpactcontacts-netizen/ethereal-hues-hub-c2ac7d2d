import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Lock, Loader2, Eye, EyeOff, X, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import loopgateLogo from '@/assets/loopgate-wordmark.png';
import {
  getRememberedAccounts,
  rememberAccount,
  forgetAccount,
  type RememberedAccount,
} from '@/lib/rememberedAccounts';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signInWithPassword } = useAuth();
  const returnTo = searchParams.get('returnTo') || '/hub';

  const [accounts, setAccounts] = useState<RememberedAccount[]>([]);
  const [selected, setSelected] = useState<RememberedAccount | null>(null);
  const [identifier, setIdentifier] = useState(''); // username or email
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAccounts(getRememberedAccounts());
  }, []);

  const resolveEmail = async (idVal: string): Promise<string | null> => {
    const isEmail = idVal.includes('@') && idVal.includes('.');
    if (isEmail) return idVal.toLowerCase();
    const uname = idVal.replace(/^@/, '').trim();
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .ilike('username', uname)
      .maybeSingle();
    if (profile?.email) return profile.email;
    // Fallback to placeholder email used by username-only signups
    return `${uname.toLowerCase()}@loopgate.local`;
  };

  const doLogin = async (emailToUse: string, pw: string, displayUsername?: string) => {
    setLoading(true);
    const { error } = await signInWithPassword(emailToUse, pw);
    if (error) {
      setLoading(false);
      if (error.message.toLowerCase().includes('invalid login')) {
        toast.error('Wrong password');
      } else {
        toast.error(error.message);
      }
      return;
    }
    // Remember (or refresh ordering)
    const username =
      displayUsername ||
      (emailToUse.endsWith('@loopgate.local')
        ? emailToUse.split('@')[0]
        : emailToUse.split('@')[0]);
    rememberAccount({ username, email: emailToUse });
    toast.success('Welcome back!');
    navigate(returnTo);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const idVal = identifier.trim();
    if (!idVal || !password) {
      toast.error('Enter username and password');
      return;
    }
    const emailToUse = selected?.email || (await resolveEmail(idVal));
    if (!emailToUse) {
      toast.error('Account not found');
      return;
    }
    await doLogin(emailToUse, password, selected?.username || idVal.replace(/^@/, ''));
  };

  const handleQuickContinue = async (acc: RememberedAccount, e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error('Enter your password');
      return;
    }
    await doLogin(acc.email, password, acc.username);
  };

  const handleForget = (e: React.MouseEvent, acc: RememberedAccount) => {
    e.stopPropagation();
    forgetAccount(acc.email);
    const next = getRememberedAccounts();
    setAccounts(next);
    if (selected?.email === acc.email) setSelected(null);
  };

  const initial = (s: string) => (s?.[0] || '?').toUpperCase();

  return (
    <div className="fixed inset-0 overflow-hidden font-apple">
      {/* Translucent backdrop matching StartPage */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#0A0A0A]" />
        <div
          className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full opacity-60"
          style={{ background: 'radial-gradient(circle, rgba(212,168,87,0.22), transparent 60%)' }}
        />
        <div
          className="absolute -bottom-40 -right-24 w-[600px] h-[600px] rounded-full opacity-50"
          style={{ background: 'radial-gradient(circle, rgba(10,132,255,0.18), transparent 60%)' }}
        />
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full opacity-40"
          style={{ background: 'radial-gradient(circle, rgba(255,45,85,0.14), transparent 65%)' }}
        />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute inset-0 backdrop-blur-2xl" style={{ background: 'rgba(8,8,10,0.35)' }} />
      </div>

      {/* Top bar */}
      <div
        className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-5"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 14px)' }}
      >
        <button
          onClick={() => navigate('/')}
          className="h-9 w-9 rounded-full flex items-center justify-center bg-white/[0.08] backdrop-blur-xl border border-white/10 active:scale-95 transition"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4 text-white" />
        </button>
        <img src={loopgateLogo} alt="Loopgate" className="h-4 opacity-80" />
        <div className="h-9 w-9" />
      </div>

      {/* Scrollable content */}
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
              {/* Hero */}
              <div className="mb-6">
                <p className="text-[11px] font-semibold tracking-[0.22em] text-[#D4A857] uppercase mb-2">
                  {accounts.length > 0 ? 'Continue As' : 'Welcome Back'}
                </p>
                <h1 className="text-white text-[34px] leading-[1.05] font-bold tracking-[-0.03em]">
                  {selected ? `Hi, ${selected.username}.` : accounts.length > 0 ? 'Pick your\nhandle.' : 'Log in.'}
                </h1>
                <p className="text-white/55 text-[14px] mt-2 leading-snug tracking-[-0.01em]">
                  {selected
                    ? 'Enter your password to jump back in.'
                    : accounts.length > 0
                    ? 'Tap an account to continue — or sign in with another.'
                    : 'One tap. You are back inside.'}
                </p>
              </div>

              {/* Remembered accounts grid */}
              <AnimatePresence initial={false}>
                {!selected && accounts.length > 0 && (
                  <motion.div
                    key="accounts"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-5"
                  >
                    <div className="grid grid-cols-2 gap-2.5">
                      {accounts.map((acc) => (
                        <button
                          key={acc.email}
                          type="button"
                          onClick={() => {
                            setSelected(acc);
                            setIdentifier(acc.username);
                          }}
                          className="group relative rounded-[16px] p-3 text-left active:scale-[0.98] transition"
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.08)',
                          }}
                        >
                          <span
                            onClick={(e) => handleForget(e, acc)}
                            className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.14] active:bg-white/[0.2] transition opacity-0 group-hover:opacity-100"
                            aria-label="Forget account"
                          >
                            <X className="h-3 w-3 text-white/80" />
                          </span>
                          <div className="flex items-center gap-2.5">
                            <div
                              className="h-10 w-10 rounded-full flex items-center justify-center text-white text-[15px] font-bold tracking-tight overflow-hidden"
                              style={{
                                background:
                                  'linear-gradient(135deg, rgba(212,168,87,0.6), rgba(10,132,255,0.5))',
                                border: '1px solid rgba(255,255,255,0.12)',
                              }}
                            >
                              {acc.avatarUrl ? (
                                <img src={acc.avatarUrl} alt={acc.username} className="h-full w-full object-cover" />
                              ) : (
                                initial(acc.username)
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-white text-[14px] font-semibold tracking-[-0.01em] truncate">
                                @{acc.username}
                              </p>
                              <p className="text-white/40 text-[11px] truncate">Tap to continue</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form
                onSubmit={(e) => (selected ? handleQuickContinue(selected, e) : handleSubmit(e))}
                className="space-y-3"
              >
                {/* Selected chip */}
                {selected && (
                  <div
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-[12px]"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center text-white text-[13px] font-bold"
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(212,168,87,0.6), rgba(10,132,255,0.5))',
                      }}
                    >
                      {initial(selected.username)}
                    </div>
                    <p className="text-white text-[14px] font-medium flex-1 truncate">
                      @{selected.username}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(null);
                        setIdentifier('');
                        setPassword('');
                      }}
                      className="text-[12px] text-[#0A84FF] font-medium px-2 py-1 active:opacity-60"
                    >
                      Switch
                    </button>
                  </div>
                )}

                {/* Identifier (only when no selected) */}
                {!selected && (
                  <div className="space-y-1.5">
                    <label className="text-[13px] text-[#8E8E93] font-medium px-1">Username or email</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                      <Input
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="@yourname"
                        autoComplete="username"
                        autoCapitalize="none"
                        spellCheck={false}
                        className="pl-10 h-12 rounded-[12px] border-0 text-[16px] text-white placeholder:text-white/35 focus-visible:ring-1 focus-visible:ring-[#D4A857]"
                        style={{ background: 'rgba(118, 118, 128, 0.24)' }}
                      />
                    </div>
                  </div>
                )}

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-[13px] text-[#8E8E93] font-medium px-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      autoCapitalize="none"
                      spellCheck={false}
                      autoFocus={!!selected}
                      className="pl-10 pr-11 h-12 rounded-[12px] border-0 text-[16px] text-white placeholder:text-white/35 focus-visible:ring-1 focus-visible:ring-[#D4A857]"
                      style={{ background: 'rgba(118, 118, 128, 0.24)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-[8px] bg-white/[0.06] active:bg-white/[0.16] flex items-center justify-center"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4 text-white/80" /> : <Eye className="h-4 w-4 text-white/80" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !password || (!selected && !identifier.trim())}
                  className="w-full h-12 rounded-[14px] bg-[#D4A857] text-white text-[17px] font-semibold active:opacity-60 disabled:opacity-50 flex items-center justify-center mt-1"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : selected ? `Continue as @${selected.username}` : 'Log in'}
                </button>
              </form>

              {/* New here */}
              <div className="text-center pt-5">
                <button
                  onClick={() => navigate('/start')}
                  className="text-[13px] text-white/50 active:opacity-60"
                >
                  New here? <span className="text-[#0A84FF] font-medium">Create a profile</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
