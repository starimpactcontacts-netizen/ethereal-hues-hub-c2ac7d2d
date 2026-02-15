import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Flame, User, ArrowLeft, Mail, Shield, Crown, Diamond, ChevronRight, Bell, Lock, LogOut, UserPlus, ShoppingBag, KeyRound, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import loopgateBrand from '@/assets/loopgate-brand.png';
import viralCartelCrest from '@/assets/viral-cartel-crest.png';

const luxuryFont = { fontFamily: "'Bebas Neue', sans-serif" };
const headerFont = { fontFamily: "'Jost', 'Futura', sans-serif", fontWeight: 400, letterSpacing: '0.25em' };

type AccountMode = 'loading' | 'anonymous' | 'signup' | 'signup-otp' | 'signin' | 'signin-otp' | 'authenticated';
type SignupMethod = 'password' | 'email-only';

export default function EnterpriseAccountPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AccountMode>('loading');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signupMethod, setSignupMethod] = useState<SignupMethod>('password');
  const [userEmail, setUserEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notificationsOn, setNotificationsOn] = useState(true);
  // For sign-in flow
  const [signinEmail, setSigninEmail] = useState('');
  const [signinPassword, setSigninPassword] = useState('');
  const [signinMethod, setSigninMethod] = useState<'password' | 'otp'>('password');
  const [showSigninPassword, setShowSigninPassword] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserEmail(session.user.email || '');
        setMode('authenticated');
      } else {
        setMode('anonymous');
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserEmail(session.user.email || '');
        setMode('authenticated');
      } else {
        setMode('anonymous');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // ─── SIGN UP with password ───
  const handleSignupPassword = async () => {
    if (!email.trim()) { toast.error('Enter your email'); return; }
    if (!password || password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signUp({ email: email.trim(), password });
      if (error) throw error;
      toast.success('Account created! Check your email to verify, then sign in.');
      setMode('signin');
      setSigninEmail(email);
      setSigninPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Signup failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── SIGN UP with email only (OTP) ───
  const handleSignupOTP = async () => {
    if (!email.trim()) { toast.error('Enter your email'); return; }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
      if (error) throw error;
      toast.success('Verification code sent to your email');
      setMode('signup-otp');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send code');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Verify OTP (signup) ───
  const handleVerifySignupOTP = async () => {
    if (otpCode.length !== 6) { toast.error('Enter the 6-digit code'); return; }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: otpCode, type: 'email' });
      if (error) throw error;
      toast.success('Welcome to the Cartel');
    } catch (err: any) {
      toast.error(err.message || 'Invalid code');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── SIGN IN with password ───
  const handleSigninPassword = async () => {
    if (!signinEmail.trim()) { toast.error('Enter your email'); return; }
    if (!signinPassword) { toast.error('Enter your password'); return; }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: signinEmail.trim(), password: signinPassword });
      if (error) throw error;
      toast.success('Welcome back');
    } catch (err: any) {
      toast.error(err.message || 'Sign in failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── SIGN IN with OTP ───
  const handleSigninSendOTP = async () => {
    if (!signinEmail.trim()) { toast.error('Enter your email'); return; }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: signinEmail.trim(), options: { shouldCreateUser: false } });
      if (error) {
        if (error.message.includes('Signups not allowed')) { toast.error('No account found with this email. Sign up first.'); }
        else throw error;
        return;
      }
      toast.success('Code sent to your email');
      setMode('signin-otp');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send code');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Verify OTP (signin) ───
  const handleVerifySigninOTP = async () => {
    if (otpCode.length !== 6) { toast.error('Enter the 6-digit code'); return; }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email: signinEmail, token: otpCode, type: 'email' });
      if (error) throw error;
      toast.success('Welcome back');
    } catch (err: any) {
      toast.error(err.message || 'Invalid code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMode('anonymous');
    setEmail('');
    setPassword('');
    setSigninEmail('');
    setSigninPassword('');
    setOtpCode('');
    toast.success('Signed out');
  };

  // Bottom nav (shared)
  const BottomNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] backdrop-blur-2xl" style={{ background: 'rgba(6,6,6,0.92)' }}>
      <div className="max-w-lg mx-auto flex items-center justify-around h-14">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: BarChart3, action: () => navigate('/enterprise/dashboard') },
          { id: 'account', label: 'Account', icon: User, action: () => {}, active: true },
        ].map(tab => (
          <button key={tab.id} onClick={tab.action} className={`flex flex-col items-center gap-0.5 transition-colors px-4 py-1 ${tab.active ? 'text-white/80' : 'text-white/30 hover:text-white/70'}`}>
            <tab.icon className="w-5 h-5" />
            <span className="text-[8px] uppercase tracking-[0.15em]" style={headerFont}>{tab.label}</span>
          </button>
        ))}
        {/* Striking center shop button */}
        <button
          onClick={() => navigate('/enterprise')}
          className="relative flex items-center justify-center -mt-5"
        >
          <span className="absolute inset-0 w-12 h-12 mx-auto rounded-full bg-[#E00000]/20 blur-xl animate-pulse" />
          <span className="relative w-12 h-12 rounded-full bg-gradient-to-br from-[#E00000] to-[#8B0000] flex items-center justify-center shadow-[0_0_20px_rgba(224,0,0,0.4)] hover:shadow-[0_0_30px_rgba(224,0,0,0.6)] hover:scale-110 active:scale-95 transition-all duration-200">
            <ShoppingBag className="w-5 h-5 text-white" />
          </span>
        </button>
      </div>
    </nav>
  );

  // Top bar
  const TopBar = () => (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl border-b border-white/[0.04]" style={{ background: 'rgba(6,6,6,0.85)' }}>
      <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/enterprise')} className="text-white/20 hover:text-white/50 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <img src={loopgateBrand} alt="LOOPGATE" className="h-3.5 w-auto opacity-70" />
        </div>
        <span className="text-[8px] text-white/15 uppercase tracking-[0.3em]" style={headerFont}>Account</span>
      </div>
    </header>
  );

  if (mode === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#060606' }}>
        <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
      </div>
    );
  }

  // ─── UNAUTHENTICATED VIEWS ───
  if (mode !== 'authenticated') {
    return (
      <div className="min-h-screen relative overflow-hidden pb-20" style={{ background: '#060606' }}>
        <TopBar />
        <BottomNav />

        <div className="pt-20 px-6 max-w-md mx-auto">
          {/* Crest */}
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 0.1, scale: 1 }} transition={{ delay: 0.1 }} className="flex justify-center mb-6">
            <img src={viralCartelCrest} alt="" className="w-20 h-auto" />
          </motion.div>

          <AnimatePresence mode="wait">
            {/* ─── LANDING (anonymous) ─── */}
            {mode === 'anonymous' && (
              <motion.div key="anon" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center">
                <div className="flex items-center gap-2 justify-center mb-2">
                  <Diamond className="w-3 h-3 text-white/8" />
                  <p className="text-[7px] text-white/12 uppercase tracking-[0.5em]" style={headerFont}>Client Portal</p>
                  <Diamond className="w-3 h-3 text-white/8" />
                </div>
                <h1 className="text-4xl text-white/90 mb-3" style={luxuryFont}>Secure Your Identity</h1>
                <p className="text-[10px] text-white/20 leading-relaxed mb-10 max-w-xs mx-auto">
                  Create a private client account to track campaigns, manage invoices, and unlock loyalty rewards. Or continue anonymously.
                </p>

                {/* Create Account */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setMode('signup')}
                  className="w-full border border-white/[0.08] p-5 mb-4 text-left relative overflow-hidden group hover:border-white/[0.15] transition-all"
                  style={{ background: 'linear-gradient(135deg, rgba(224,0,0,0.04) 0%, rgba(10,10,10,1) 100%)' }}
                >
                  <span className="absolute top-0 left-0 border-t border-l border-[#E00000]/15 w-4 h-4" />
                  <span className="absolute bottom-0 right-0 border-b border-r border-[#E00000]/15 w-4 h-4" />
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 border border-[#E00000]/20 flex items-center justify-center bg-[#E00000]/5">
                      <UserPlus className="w-4 h-4 text-[#E00000]/50" />
                    </div>
                    <div className="flex-1">
                      <p className="text-lg text-white/80" style={luxuryFont}>Create Account</p>
                      <p className="text-[8px] text-white/20 uppercase tracking-wider">Email + password or email-only</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-white/30 transition-colors" />
                  </div>
                </motion.button>

                {/* Anonymous */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="border border-white/[0.05] p-5 text-left" style={{ background: 'rgba(255,255,255,0.01)' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 border border-white/[0.06] flex items-center justify-center bg-white/[0.02]">
                      <ShoppingBag className="w-4 h-4 text-white/20" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white/50" style={luxuryFont}>Stay Anonymous</p>
                      <p className="text-[8px] text-white/15 leading-relaxed mt-0.5">
                        Purchase any slot — your receipt is tied to your email at checkout.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/[0.04]">
                    <button onClick={() => navigate('/enterprise')} className="text-[8px] text-[#E00000]/40 hover:text-[#E00000]/70 uppercase tracking-[0.3em] transition-colors flex items-center gap-1.5">
                      <Flame className="w-3 h-3" /> Browse Available Slots
                    </button>
                  </div>
                </motion.div>

                {/* Sign In link */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mt-8">
                  <button onClick={() => setMode('signin')} className="text-[8px] text-white/12 hover:text-white/30 uppercase tracking-[0.3em] transition-colors mx-auto flex items-center gap-1.5">
                    <KeyRound className="w-3 h-3" /> Already have an account? Sign in
                  </button>
                </motion.div>
              </motion.div>
            )}

            {/* ─── SIGN UP ─── */}
            {mode === 'signup' && (
              <motion.div key="signup" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center">
                <h1 className="text-3xl text-white/90 mb-2" style={luxuryFont}>Create Account</h1>
                <p className="text-[9px] text-white/15 mb-6 uppercase tracking-[0.2em]" style={headerFont}>Choose your signup method</p>

                {/* Method toggle */}
                <div className="flex border border-white/[0.08] mb-6">
                  <button
                    onClick={() => setSignupMethod('password')}
                    className={`flex-1 py-2.5 text-[9px] uppercase tracking-[0.2em] transition-colors ${signupMethod === 'password' ? 'bg-white/[0.06] text-white/70' : 'text-white/25 hover:text-white/40'}`}
                  >
                    <Lock className="w-3 h-3 inline mr-1.5" />Password
                  </button>
                  <button
                    onClick={() => setSignupMethod('email-only')}
                    className={`flex-1 py-2.5 text-[9px] uppercase tracking-[0.2em] transition-colors ${signupMethod === 'email-only' ? 'bg-white/[0.06] text-white/70' : 'text-white/25 hover:text-white/40'}`}
                  >
                    <Mail className="w-3 h-3 inline mr-1.5" />Email Only
                  </button>
                </div>

                <div className="space-y-4">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/[0.03] border-white/[0.08] text-sm text-white/80 rounded-none h-12 text-center placeholder:text-white/15"
                  />

                  {signupMethod === 'password' && (
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a password (min 6 chars)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-white/[0.03] border-white/[0.08] text-sm text-white/80 rounded-none h-12 text-center placeholder:text-white/15 pr-10"
                        onKeyDown={(e) => e.key === 'Enter' && handleSignupPassword()}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  )}

                  <Button
                    onClick={signupMethod === 'password' ? handleSignupPassword : handleSignupOTP}
                    disabled={isSubmitting || !email.trim() || (signupMethod === 'password' && password.length < 6)}
                    className="w-full bg-[#E00000]/90 hover:bg-[#E00000] text-white rounded-none h-12 text-[10px] uppercase tracking-[0.3em] disabled:opacity-30"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (signupMethod === 'password' ? 'Create Account' : 'Send Code')}
                  </Button>
                </div>

                {signupMethod === 'password' && (
                  <p className="text-[8px] text-white/10 mt-3">You'll need to verify your email before signing in.</p>
                )}

                <div className="flex items-center justify-center gap-4 mt-6">
                  <button onClick={() => { setMode('anonymous'); setEmail(''); setPassword(''); }} className="text-[8px] text-white/10 hover:text-white/25 uppercase tracking-[0.3em] transition-colors">← Back</button>
                  <span className="text-white/5">|</span>
                  <button onClick={() => { setMode('signin'); setSigninEmail(email); }} className="text-[8px] text-white/10 hover:text-white/25 uppercase tracking-[0.3em] transition-colors">Sign In →</button>
                </div>
              </motion.div>
            )}

            {/* ─── SIGN UP OTP VERIFY ─── */}
            {mode === 'signup-otp' && (
              <motion.div key="signup-otp" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center">
                <h1 className="text-3xl text-white/90 mb-2" style={luxuryFont}>Verify Code</h1>
                <p className="text-[9px] text-white/20 mb-1">Sent to</p>
                <p className="text-[10px] text-white/40 mb-8 font-mono">{email}</p>

                <div className="flex justify-center mb-6">
                  <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                    <InputOTPGroup className="gap-2">
                      {[0,1,2,3,4,5].map(i => (
                        <InputOTPSlot key={i} index={i} className="bg-white/[0.03] border-white/[0.08] text-white/80 rounded-none w-10 h-12" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  onClick={handleVerifySignupOTP}
                  disabled={isSubmitting || otpCode.length !== 6}
                  className="w-full bg-[#E00000]/90 hover:bg-[#E00000] text-white rounded-none h-12 text-[10px] uppercase tracking-[0.3em] disabled:opacity-30"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Enter'}
                </Button>

                <button onClick={() => { setMode('signup'); setOtpCode(''); }} className="mt-6 text-[8px] text-white/10 hover:text-white/25 uppercase tracking-[0.3em] transition-colors">← Change email</button>
              </motion.div>
            )}

            {/* ─── SIGN IN ─── */}
            {mode === 'signin' && (
              <motion.div key="signin" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center">
                <h1 className="text-3xl text-white/90 mb-2" style={luxuryFont}>Welcome Back</h1>
                <p className="text-[9px] text-white/15 mb-6 uppercase tracking-[0.2em]" style={headerFont}>Sign in to your account</p>

                {/* Method toggle */}
                <div className="flex border border-white/[0.08] mb-6">
                  <button
                    onClick={() => setSigninMethod('password')}
                    className={`flex-1 py-2.5 text-[9px] uppercase tracking-[0.2em] transition-colors ${signinMethod === 'password' ? 'bg-white/[0.06] text-white/70' : 'text-white/25 hover:text-white/40'}`}
                  >
                    <Lock className="w-3 h-3 inline mr-1.5" />Password
                  </button>
                  <button
                    onClick={() => setSigninMethod('otp')}
                    className={`flex-1 py-2.5 text-[9px] uppercase tracking-[0.2em] transition-colors ${signinMethod === 'otp' ? 'bg-white/[0.06] text-white/70' : 'text-white/25 hover:text-white/40'}`}
                  >
                    <Mail className="w-3 h-3 inline mr-1.5" />Email Code
                  </button>
                </div>

                <div className="space-y-4">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={signinEmail}
                    onChange={(e) => setSigninEmail(e.target.value)}
                    className="bg-white/[0.03] border-white/[0.08] text-sm text-white/80 rounded-none h-12 text-center placeholder:text-white/15"
                  />

                  {signinMethod === 'password' && (
                    <div className="relative">
                      <Input
                        type={showSigninPassword ? 'text' : 'password'}
                        placeholder="Your password"
                        value={signinPassword}
                        onChange={(e) => setSigninPassword(e.target.value)}
                        className="bg-white/[0.03] border-white/[0.08] text-sm text-white/80 rounded-none h-12 text-center placeholder:text-white/15 pr-10"
                        onKeyDown={(e) => e.key === 'Enter' && handleSigninPassword()}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSigninPassword(!showSigninPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40"
                      >
                        {showSigninPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  )}

                  <Button
                    onClick={signinMethod === 'password' ? handleSigninPassword : handleSigninSendOTP}
                    disabled={isSubmitting || !signinEmail.trim() || (signinMethod === 'password' && !signinPassword)}
                    className="w-full bg-[#E00000]/90 hover:bg-[#E00000] text-white rounded-none h-12 text-[10px] uppercase tracking-[0.3em] disabled:opacity-30"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (signinMethod === 'password' ? 'Sign In' : 'Send Code')}
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-4 mt-6">
                  <button onClick={() => setMode('anonymous')} className="text-[8px] text-white/10 hover:text-white/25 uppercase tracking-[0.3em] transition-colors">← Back</button>
                  <span className="text-white/5">|</span>
                  <button onClick={() => { setMode('signup'); setEmail(signinEmail); }} className="text-[8px] text-white/10 hover:text-white/25 uppercase tracking-[0.3em] transition-colors">Create Account →</button>
                </div>
              </motion.div>
            )}

            {/* ─── SIGN IN OTP VERIFY ─── */}
            {mode === 'signin-otp' && (
              <motion.div key="signin-otp" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center">
                <h1 className="text-3xl text-white/90 mb-2" style={luxuryFont}>Verify Code</h1>
                <p className="text-[9px] text-white/20 mb-1">Sent to</p>
                <p className="text-[10px] text-white/40 mb-8 font-mono">{signinEmail}</p>

                <div className="flex justify-center mb-6">
                  <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                    <InputOTPGroup className="gap-2">
                      {[0,1,2,3,4,5].map(i => (
                        <InputOTPSlot key={i} index={i} className="bg-white/[0.03] border-white/[0.08] text-white/80 rounded-none w-10 h-12" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  onClick={handleVerifySigninOTP}
                  disabled={isSubmitting || otpCode.length !== 6}
                  className="w-full bg-[#E00000]/90 hover:bg-[#E00000] text-white rounded-none h-12 text-[10px] uppercase tracking-[0.3em] disabled:opacity-30"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Enter'}
                </Button>

                <div className="flex justify-between mt-4">
                  <button onClick={() => { setMode('signin'); setOtpCode(''); }} className="text-[8px] text-white/10 hover:text-white/25 transition-colors">← Change email</button>
                  <button onClick={handleSigninSendOTP} disabled={isSubmitting} className="text-[8px] text-white/10 hover:text-white/25 transition-colors">Resend</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ─── AUTHENTICATED VIEW ───
  return (
    <div className="min-h-screen relative overflow-hidden pb-20" style={{ background: '#060606' }}>
      <TopBar />
      <BottomNav />

      <div className="pt-16 px-5 max-w-2xl mx-auto">
        {/* Luxury Header with Crest */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10 pt-4">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 0.12, scale: 1 }} transition={{ delay: 0.2 }} className="mb-4">
            <img src={viralCartelCrest} alt="" className="w-16 h-auto mx-auto" />
          </motion.div>
          <div className="flex items-center gap-2 justify-center mb-2">
            <Diamond className="w-3 h-3 text-white/10" />
            <p className="text-[8px] text-white/15 uppercase tracking-[0.5em]" style={headerFont}>Private Client</p>
            <Diamond className="w-3 h-3 text-white/10" />
          </div>
          <h1 className="text-4xl text-white/90" style={luxuryFont}>Your Account</h1>
        </motion.div>

        {/* Client Status Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="border border-white/[0.08] p-6 mb-6 relative" style={{ background: 'linear-gradient(135deg, rgba(27,67,50,0.05) 0%, rgba(10,10,10,1) 100%)' }}>
          <span className="absolute top-0 left-0 border-t border-l border-white/10 w-4 h-4" />
          <span className="absolute top-0 right-0 border-t border-r border-white/10 w-4 h-4" />
          <span className="absolute bottom-0 left-0 border-b border-l border-white/10 w-4 h-4" />
          <span className="absolute bottom-0 right-0 border-b border-r border-white/10 w-4 h-4" />

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#1B4332]/20 border border-[#1B4332]/30 flex items-center justify-center">
              <Crown className="w-4 h-4 text-[#1B4332]" />
            </div>
            <div>
              <p className="text-lg text-white/80" style={luxuryFont}>Active Client</p>
              <p className="text-[8px] text-[#1B4332]/60 uppercase tracking-wider">Verified · Full Access</p>
            </div>
          </div>
          <div className="h-px bg-white/[0.04] mb-4" />
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg text-white/60 tabular-nums" style={luxuryFont}>0</p>
              <p className="text-[7px] text-white/12 uppercase tracking-wider">Campaigns</p>
            </div>
            <div>
              <p className="text-lg text-white/60 tabular-nums" style={luxuryFont}>$0</p>
              <p className="text-[7px] text-white/12 uppercase tracking-wider">Total Spent</p>
            </div>
            <div>
              <p className="text-lg text-white/60 tabular-nums" style={luxuryFont}>—</p>
              <p className="text-[7px] text-white/12 uppercase tracking-wider">Total Reach</p>
            </div>
          </div>
        </motion.div>

        {/* Email Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="border border-white/[0.06] p-5 mb-4" style={{ background: 'rgba(255,255,255,0.01)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Mail className="w-4 h-4 text-white/15" />
            <p className="text-[9px] text-white/20 uppercase tracking-[0.3em]" style={headerFont}>Email</p>
          </div>
          <div className="flex items-center gap-3">
            <Input value={userEmail} readOnly className="bg-white/[0.02] border-white/[0.04] text-sm text-white/50 rounded-none flex-1 cursor-default" />
            <Button size="sm" variant="outline" className="border-white/[0.08] text-white/30 hover:text-white/60 rounded-none text-[8px] uppercase tracking-wider h-9 px-4"
              onClick={() => toast.info('Contact team@loopgate.io to change email')}>
              Change
            </Button>
          </div>
        </motion.div>

        {/* Settings List */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="border border-white/[0.06] divide-y divide-white/[0.04] mb-6" style={{ background: 'rgba(255,255,255,0.01)' }}>
          <button onClick={() => { setNotificationsOn(!notificationsOn); toast.success(notificationsOn ? 'Notifications off' : 'Notifications on'); }}
            className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-white/15" />
              <div className="text-left">
                <p className="text-[11px] text-white/60">Drop Notifications</p>
                <p className="text-[8px] text-white/15">Get pinged on new slot drops & campaign updates</p>
              </div>
            </div>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${notificationsOn ? 'bg-[#1B4332]' : 'bg-white/10'}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${notificationsOn ? 'left-4' : 'left-0.5'}`} />
            </div>
          </button>

          <button className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors" onClick={() => toast.info('Secured via your chosen authentication method')}>
            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-white/15" />
              <div className="text-left">
                <p className="text-[11px] text-white/60">Security</p>
                <p className="text-[8px] text-white/15">Password or email OTP authentication</p>
              </div>
            </div>
            <Shield className="w-4 h-4 text-[#1B4332]/40" />
          </button>

          <button className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors" onClick={() => toast.info('Invoice history coming soon')}>
            <div className="flex items-center gap-3">
              <BarChart3 className="w-4 h-4 text-white/15" />
              <div className="text-left">
                <p className="text-[11px] text-white/60">Invoices & Receipts</p>
                <p className="text-[8px] text-white/15">View past transaction records</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/10" />
          </button>
        </motion.div>

        {/* Loyalty Rewards */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="border border-white/[0.08] p-6 mb-6 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, rgba(224,0,0,0.03) 0%, rgba(10,10,10,1) 100%)' }}>
          <span className="absolute top-0 left-0 border-t border-l border-[#E00000]/15 w-5 h-5" />
          <span className="absolute top-0 right-0 border-t border-r border-[#E00000]/15 w-5 h-5" />
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-4 h-4 text-[#E00000]/30" />
            <p className="text-[8px] text-[#E00000]/40 uppercase tracking-[0.4em]">Loyalty Rewards</p>
          </div>
          <h3 className="text-xl text-white/70 mb-2" style={luxuryFont}>Unlock Exclusive Discounts</h3>
          <p className="text-[10px] text-white/15 leading-relaxed mb-4">
            Returning clients unlock priority access to new drops and reduced rates on future campaigns. Your loyalty doesn't go unnoticed.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#E00000]/30" />
            <span className="text-[8px] text-white/20 uppercase tracking-wider">Next discount unlocks at 3 campaigns</span>
          </div>
        </motion.div>

        {/* Contact Support */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="border border-white/[0.06] p-5 mb-8 text-center" style={{ background: 'rgba(255,255,255,0.01)' }}>
          <p className="text-[10px] text-white/15 mb-3">Need dedicated support?</p>
          <Button
            onClick={() => window.location.href = 'mailto:team@loopgate.io'}
            className="bg-white/[0.04] hover:bg-white/[0.08] text-white/40 h-10 px-8 text-[9px] uppercase tracking-[0.3em] rounded-none border border-white/[0.06]"
          >
            <Mail className="w-3 h-3 mr-2" /> Contact Team
          </Button>
        </motion.div>

        {/* Sign Out */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-center pb-10">
          <button onClick={handleSignOut} className="text-[9px] text-white/10 hover:text-white/30 uppercase tracking-[0.3em] transition-colors flex items-center gap-2 mx-auto">
            <LogOut className="w-3 h-3" /> Sign Out
          </button>
        </motion.div>
      </div>
    </div>
  );
}
