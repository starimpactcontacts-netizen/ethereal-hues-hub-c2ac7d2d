import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Lock, Loader2, Eye, EyeOff, X, User, Zap, KeyRound } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import authCollageBg from '@/assets/auth-collage-bg.jpg';
import loopgateIcon from '@/assets/loopgate-logo.png';
import {
  getRememberedAccounts,
  rememberAccount,
  forgetAccount,
  decodePassword,
  decodeRefreshToken,
  type RememberedAccount,
} from '@/lib/rememberedAccounts';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signInWithPassword, signInWithGoogle, signInWithDiscord } = useAuth();
  const [oauthLoading, setOauthLoading] = useState(false);
  const returnTo = searchParams.get('returnTo') || '/hub';

  const [accounts, setAccounts] = useState<RememberedAccount[]>([]);
  const [selected, setSelected] = useState<RememberedAccount | null>(null);
  const [identifier, setIdentifier] = useState(''); // username or email
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Reclaim flow for username-only anonymous accounts
  const [showReclaim, setShowReclaim] = useState(false);
  const [reclaimUser, setReclaimUser] = useState('');
  const [reclaimPw, setReclaimPw] = useState('');
  const [reclaimLoading, setReclaimLoading] = useState(false);

  const handleReclaim = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = reclaimUser.trim().replace(/^@/, '');
    if (u.length < 3) { toast.error('Enter your old handle'); return; }
    if (reclaimPw.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setReclaimLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('reclaim-guest-account', {
        body: { username: u, password: reclaimPw },
      });
      if (error || data?.error) {
        toast.error(data?.error || error?.message || 'Could not reclaim account');
        setReclaimLoading(false);
        return;
      }
      toast.success(`Reclaimed @${data.username} — logging you in`);
      await doLogin(data.email, reclaimPw, data.username);
    } catch (err) {
      toast.error('Could not reclaim account');
    } finally {
      setReclaimLoading(false);
    }
  };

  useEffect(() => {
    const initial = getRememberedAccounts();
    // Sanitize immediately so UI never shows an email as the handle
    const sanitized = initial.map((a) => {
      if (a.username.includes('@')) {
        const cleaned = a.username.split('@')[0];
        rememberAccount({
          username: cleaned,
          email: a.email,
          avatarUrl: a.avatarUrl ?? null,
        });
        return { ...a, username: cleaned };
      }
      return a;
    });
    setAccounts(sanitized);
    // Backfill: query profiles by email, then by username-prefix fallback
    (async () => {
      const needsFix = sanitized.filter(
        (a) => a.username.includes('@') || !a.avatarUrl,
      );
      if (needsFix.length === 0) return;
      let changed = false;
      for (const acc of needsFix) {
        try {
          // 1) Try direct email match
          let { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('email', acc.email)
            .maybeSingle();
          // 2) Fallback: usernames are auto-generated as "<emailprefix>_xxxx"
          if (!profile) {
            const prefix = acc.email.split('@')[0].toLowerCase();
            const { data: byPrefix } = await supabase
              .from('profiles')
              .select('username, avatar_url')
              .ilike('username', `${prefix}%`)
              .limit(1)
              .maybeSingle();
            profile = byPrefix as any;
          }
          if (profile?.username) {
            rememberAccount({
              username: profile.username,
              email: acc.email,
              avatarUrl: profile.avatar_url ?? acc.avatarUrl ?? null,
            });
            changed = true;
          }
        } catch { /* ignore */ }
      }
      if (changed) setAccounts(getRememberedAccounts());
    })();
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
    // Pull the real username + avatar from the profile so the remembered
    // chip shows the handle (not the email).
    let username = displayUsername || '';
    let avatarUrl: string | null | undefined = undefined;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', user.id)
          .maybeSingle();
        if (profile?.username) username = profile.username;
        if (profile?.avatar_url) avatarUrl = profile.avatar_url;
        // Last-resort fallback to the auth metadata username
        const metaName = (user.user_metadata as any)?.username;
        if (!username && metaName) username = metaName;
      }
    } catch { /* ignore */ }
    if (!username) {
      username = emailToUse.endsWith('@loopgate.local')
        ? emailToUse.split('@')[0]
        : emailToUse.split('@')[0];
    }
    rememberAccount({ username, email: emailToUse, avatarUrl, password: pw });
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

  // One-tap login when we have the saved password
  const handleAccountTap = async (acc: RememberedAccount) => {
    // Guest accounts have no password — restore the session from the
    // saved refresh token instead, so the user gets back into the same
    // anonymous user_id (XP, history, profile all intact).
    if (acc.isGuest) {
      const rt = decodeRefreshToken(acc.rt);
      if (!rt) {
        toast.error('This guest session expired — pick a new nickname');
        return;
      }
      setLoading(true);
      const { data, error } = await supabase.auth.refreshSession({ refresh_token: rt });
      if (error || !data.session) {
        setLoading(false);
        toast.error('Could not restore guest — please set a password next time');
        return;
      }
      // Update the stored refresh token (it rotates on each refresh)
      rememberAccount({
        username: acc.username,
        email: acc.email,
        avatarUrl: acc.avatarUrl,
        refreshToken: data.session.refresh_token,
        isGuest: true,
      });
      toast.success(`Welcome back, @${acc.username}`, {
        description: 'Tip: set a password in Settings to lock in your account',
      });
      navigate(returnTo);
      return;
    }
    const savedPw = decodePassword(acc.pw);
    if (savedPw) {
      await doLogin(acc.email, savedPw, acc.username);
      return;
    }
    // Fall back: ask for password
    setSelected(acc);
    setIdentifier(acc.username);
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
        {/* Poster collage peek */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-55"
          style={{ backgroundImage: `url(${authCollageBg})` }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.7) 100%)' }} />
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
        <div />
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
                <img
                  src={loopgateIcon}
                  alt="Loopgate"
                  className="h-12 w-12 mb-4 rounded-[12px] object-contain"
                  style={{ filter: 'drop-shadow(0 8px 20px rgba(212,168,87,0.35))' }}
                />
                <p className="text-[11px] font-semibold tracking-[0.22em] text-[#D4A857] uppercase mb-2">
                  {accounts.length > 0 ? 'Welcome Back' : 'Welcome Back'}
                </p>
                <h1 className="text-white text-[34px] leading-[1.05] font-bold tracking-[-0.03em]">
                  {selected
                    ? `Hi, ${selected.username}.`
                    : accounts.length === 1
                    ? `Hey, ${accounts[0].username}.`
                    : accounts.length > 1
                    ? 'Pick your\nhandle.'
                    : 'Log in.'}
                </h1>
                <p className="text-white/55 text-[14px] mt-2 leading-snug tracking-[-0.01em]">
                  {selected
                    ? 'Enter your password to jump back in.'
                    : accounts.length === 1
                    ? accounts[0].pw
                      ? 'Tap your photo to jump right back in.'
                      : 'Tap your handle and enter your password.'
                    : accounts.length > 1
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
                          onClick={() => handleAccountTap(acc)}
                          disabled={loading}
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
                              <p className="text-white/40 text-[11px] truncate flex items-center gap-1">
                                {acc.isGuest ? (
                                  <><KeyRound className="h-2.5 w-2.5 text-[#FF9F0A]" /> Set password</>
                                ) : acc.pw ? (
                                  <><Zap className="h-2.5 w-2.5 text-[#D4A857]" /> One‑tap login</>
                                ) : (
                                  'Tap to continue'
                                )}
                              </p>
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

              {/* OAuth — divider + provider buttons */}
              <div className="relative flex items-center my-4">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
                <span className="px-3 text-[11px] text-white/35 font-medium select-none">OR</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
              </div>
              <div className="space-y-2.5">
                {/* Google */}
                <button
                  type="button"
                  disabled={oauthLoading || loading}
                  onClick={async () => { setOauthLoading(true); await signInWithGoogle(); setOauthLoading(false); }}
                  className="w-full h-12 rounded-[14px] flex items-center justify-center gap-3 text-[15px] font-semibold text-white active:opacity-60 disabled:opacity-50 transition"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>
                {/* Discord */}
                <button
                  type="button"
                  disabled={oauthLoading || loading}
                  onClick={async () => { setOauthLoading(true); await signInWithDiscord(); setOauthLoading(false); }}
                  className="w-full h-12 rounded-[14px] flex items-center justify-center gap-3 text-[15px] font-semibold text-white active:opacity-60 disabled:opacity-50 transition"
                  style={{ background: 'rgba(88,101,242,0.18)', border: '1px solid rgba(88,101,242,0.40)' }}
                >
                  <svg width="20" height="16" viewBox="0 0 71 55" fill="none" aria-hidden>
                    <path d="M60.1 4.9A19.8 19.8 0 0 0 45.7.4a.07.07 0 0 0-.08.04c-.63 1.11-1.32 2.56-1.8 3.69a18.3 18.3 0 0 0-5.49 0A12.6 12.6 0 0 0 36.7.44a.08.08 0 0 0-.08.04A19.7 19.7 0 0 0 3.68 4.37a.07.07 0 0 0-.03.03C.53 18.73-.32 32.14.1 45.39a.08.08 0 0 0 .03.06 19.9 19.9 0 0 0 6 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.3 1.23-1.99a.08.08 0 0 0-.04-.11 13.1 13.1 0 0 1-1.87-.89.08.08 0 0 1-.01-.13c.13-.1.25-.2.37-.29a.07.07 0 0 1 .08-.01c3.93 1.79 8.18 1.79 12.06 0a.07.07 0 0 1 .08.01c.12.1.25.2.37.29a.08.08 0 0 1-.01.13 12.3 12.3 0 0 1-1.87.89.08.08 0 0 0-.04.11c.36.7.77 1.36 1.22 1.99a.08.08 0 0 0 .08.03 19.8 19.8 0 0 0 6-3.03.08.08 0 0 0 .03-.05c.5-5.18-.84-9.67-3.55-13.66a.06.06 0 0 0-.03-.03zM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.33-.96 2.42-2.16 2.42zm7.97 0c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.33-.95 2.42-2.16 2.42z" fill="white"/>
                  </svg>
                  Continue with Discord
                </button>
              </div>

              {/* New here */}
              <div className="text-center pt-5">
                <button
                  onClick={() => navigate('/start')}
                  className="text-[13px] text-white/50 active:opacity-60"
                >
                  New here? <span className="text-[#0A84FF] font-medium">Create a profile</span>
                </button>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setShowReclaim((v) => !v)}
                    className="text-[12px] text-white/40 active:opacity-60"
                  >
                    Lost a username-only account?{' '}
                    <span className="text-[#D4A857] font-medium">Reclaim it</span>
                  </button>
                </div>
                {showReclaim && (
                  <form onSubmit={handleReclaim} className="mt-3 text-left space-y-2 p-3 rounded-[14px]"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <p className="text-[11px] text-white/55 leading-snug">
                      If you signed up with just a nickname (no password), enter it
                      below and choose a password to lock it in. We'll restore your
                      profile, XP, and history.
                    </p>
                    <Input
                      value={reclaimUser}
                      onChange={(e) => setReclaimUser(e.target.value)}
                      placeholder="Old handle (e.g. slaxeditz)"
                      autoCapitalize="none"
                      spellCheck={false}
                      className="h-11 rounded-[10px] border-0 text-[15px] text-white placeholder:text-white/35"
                      style={{ background: 'rgba(118, 118, 128, 0.24)' }}
                    />
                    <Input
                      type="password"
                      value={reclaimPw}
                      onChange={(e) => setReclaimPw(e.target.value)}
                      placeholder="New password (6+ chars)"
                      autoComplete="new-password"
                      className="h-11 rounded-[10px] border-0 text-[15px] text-white placeholder:text-white/35"
                      style={{ background: 'rgba(118, 118, 128, 0.24)' }}
                    />
                    <button
                      type="submit"
                      disabled={reclaimLoading}
                      className="w-full h-11 rounded-[12px] bg-white/10 text-white text-[14px] font-semibold active:opacity-60 disabled:opacity-50 flex items-center justify-center"
                    >
                      {reclaimLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reclaim & set password'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
