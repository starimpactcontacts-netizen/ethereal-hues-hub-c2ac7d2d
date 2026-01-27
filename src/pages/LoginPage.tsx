import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Mail, Lock, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import loopgateLogo from '@/assets/loopgate-wordmark.png';

type LoginMethod = 'username' | 'email' | 'magic';
type MagicSubMethod = 'choose' | 'one-tap' | 'code';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signInWithPassword, signInWithMagicLink, signInWithOtp } = useAuth();
  
  const [method, setMethod] = useState<LoginMethod>('username');
  const [identifier, setIdentifier] = useState(''); // username or email
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Magic link state
  const [magicSubMethod, setMagicSubMethod] = useState<MagicSubMethod>('choose');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [tokenHash, setTokenHash] = useState<string | undefined>();

  const handleUsernameLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!identifier.trim() || !password.trim()) {
      toast.error('Please enter username and password');
      return;
    }

    setLoading(true);
    
    // First, look up the email by username
    const { data: profile, error: lookupError } = await supabase
      .from('profiles')
      .select('email')
      .ilike('username', identifier.trim())
      .maybeSingle();
    
    if (lookupError) {
      toast.error('Something went wrong');
      setLoading(false);
      return;
    }

    if (!profile) {
      toast.error('Username not found');
      setLoading(false);
      return;
    }

    if (!profile.email) {
      // This is a temp profile that was never verified
      toast.error('This profile needs to be secured first. Create an account at /start');
      setLoading(false);
      return;
    }

    // Now sign in with the email
    const { error } = await signInWithPassword(profile.email, password);
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Wrong password');
      } else {
        toast.error(error.message);
      }
      setLoading(false);
      return;
    }

    toast.success('Welcome back!');
    navigate('/hub');
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!identifier.trim() || !password.trim()) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);
    const { error } = await signInWithPassword(identifier.trim(), password);
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Wrong email or password');
      } else {
        toast.error(error.message);
      }
      setLoading(false);
      return;
    }

    toast.success('Welcome back!');
    navigate('/hub');
  };

  const handleMagicLinkRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!identifier.trim()) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    const { error, tokenHash: hash } = await signInWithMagicLink(identifier.trim());
    
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    setTokenHash(hash);
    setMagicLinkSent(true);
    toast.success('Magic link sent! Check your email.');
    setLoading(false);
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otpCode.trim()) {
      toast.error('Please enter the code');
      return;
    }

    setLoading(true);
    const { error } = await signInWithOtp(identifier.trim(), otpCode.trim(), tokenHash);
    
    if (error) {
      toast.error('Invalid or expired code');
      setLoading(false);
      return;
    }

    toast.success('Welcome back!');
    navigate('/hub');
  };

  const resetMethod = (newMethod: LoginMethod) => {
    setMethod(newMethod);
    setIdentifier('');
    setPassword('');
    setMagicSubMethod('choose');
    setMagicLinkSent(false);
    setOtpCode('');
    setTokenHash(undefined);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <img src={loopgateLogo} alt="Loopgate" className="h-6 opacity-80" />
        <button
          onClick={() => navigate('/start')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-20">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl sm:text-5xl mb-3">
              Log In
            </h1>
            <p className="text-muted-foreground">
              Welcome back, editor
            </p>
          </div>

          {/* Method Tabs */}
          <div className="flex gap-1 p-1 bg-surface-1 rounded-lg mb-6">
            <button
              onClick={() => resetMethod('username')}
              className={`flex-1 py-2.5 px-3 text-sm font-medium rounded-md transition-all ${
                method === 'username' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <User className="h-4 w-4 inline mr-1.5 -mt-0.5" />
              Username
            </button>
            <button
              onClick={() => resetMethod('email')}
              className={`flex-1 py-2.5 px-3 text-sm font-medium rounded-md transition-all ${
                method === 'email' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Mail className="h-4 w-4 inline mr-1.5 -mt-0.5" />
              Email
            </button>
            <button
              onClick={() => resetMethod('magic')}
              className={`flex-1 py-2.5 px-3 text-sm font-medium rounded-md transition-all ${
                method === 'magic' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="h-4 w-4 inline mr-1.5 -mt-0.5" />
              Magic
            </button>
          </div>

          <AnimatePresence mode="wait">
            {/* Username + Password */}
            {method === 'username' && (
              <motion.form
                key="username"
                onSubmit={handleUsernameLogin}
                className="space-y-5"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="your_username"
                      className="pl-12 h-14 bg-surface-1 border-border text-lg"
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-12 h-14 bg-surface-1 border-border text-lg"
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !identifier.trim() || !password.trim()}
                  className="w-full h-14 bg-gold hover:bg-gold/90 text-gold-foreground font-display text-xl"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Log In
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </motion.form>
            )}

            {/* Email + Password */}
            {method === 'email' && (
              <motion.form
                key="email"
                onSubmit={handleEmailLogin}
                className="space-y-5"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="email"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-12 h-14 bg-surface-1 border-border text-lg"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-12 h-14 bg-surface-1 border-border text-lg"
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !identifier.trim() || !password.trim()}
                  className="w-full h-14 bg-gold hover:bg-gold/90 text-gold-foreground font-display text-xl"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Log In
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </motion.form>
            )}

            {/* Magic - Choose Method */}
            {method === 'magic' && magicSubMethod === 'choose' && (
              <motion.div
                key="magic-choose"
                className="space-y-5"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-center text-muted-foreground text-sm mb-2">
                  Choose your login method
                </p>
                
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setMagicSubMethod('one-tap')}
                    className="w-full p-4 rounded-lg bg-surface-1 border border-border hover:border-gold/50 transition-all text-left flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-gold" />
                    </div>
                    <div>
                      <p className="font-medium">One-Tap Magic Link</p>
                      <p className="text-sm text-muted-foreground">Click the link in your email</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setMagicSubMethod('code')}
                    className="w-full p-4 rounded-lg bg-gold/10 border border-gold hover:bg-gold/20 transition-all text-left flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-gold" />
                    </div>
                    <div>
                      <p className="font-medium">6-Digit Code</p>
                      <p className="text-sm text-muted-foreground">Enter code from your email</p>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Magic Link - Email Entry */}
            {method === 'magic' && (magicSubMethod === 'one-tap' || magicSubMethod === 'code') && !magicLinkSent && (
              <motion.form
                key="magic-request"
                onSubmit={handleMagicLinkRequest}
                className="space-y-5"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  type="button"
                  onClick={() => setMagicSubMethod('choose')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mb-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>

                <div className="text-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3">
                    {magicSubMethod === 'one-tap' ? (
                      <Sparkles className="h-6 w-6 text-gold" />
                    ) : (
                      <Lock className="h-6 w-6 text-gold" />
                    )}
                  </div>
                  <p className="text-sm font-medium">
                    {magicSubMethod === 'one-tap' ? 'One-Tap Magic Link' : '6-Digit Code Login'}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="email"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-12 h-14 bg-surface-1 border-border text-lg"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !identifier.trim()}
                  className="w-full h-14 bg-gold hover:bg-gold/90 text-gold-foreground font-display text-xl"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      {magicSubMethod === 'one-tap' ? <Sparkles className="mr-2 h-5 w-5" /> : <Lock className="mr-2 h-5 w-5" />}
                      Send {magicSubMethod === 'one-tap' ? 'Magic Link' : 'Code'}
                    </>
                  )}
                </Button>
              </motion.form>
            )}

            {/* OTP Verification */}
            {method === 'magic' && magicLinkSent && (
              <motion.form
                key="magic-verify"
                onSubmit={handleOtpVerify}
                className="space-y-5"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                    {magicSubMethod === 'one-tap' ? (
                      <Sparkles className="h-8 w-8 text-gold" />
                    ) : (
                      <Lock className="h-8 w-8 text-gold" />
                    )}
                  </div>
                  <p className="text-sm font-medium mb-1">
                    {magicSubMethod === 'one-tap' ? 'Check your email for the magic link!' : 'Enter your 6-digit code'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sent to {identifier}
                  </p>
                </div>

                {magicSubMethod === 'code' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-center block">
                        Enter 6-Digit Code
                      </label>
                      <Input
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="h-14 bg-surface-1 border-border text-2xl text-center tracking-[0.5em] font-mono"
                        maxLength={6}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="one-time-code"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loading || !otpCode.trim()}
                      className="w-full h-14 bg-gold hover:bg-gold/90 text-gold-foreground font-display text-xl"
                    >
                      {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        'Verify Code'
                      )}
                    </Button>
                  </>
                )}

                {magicSubMethod === 'one-tap' && (
                  <div className="text-center p-4 bg-surface-1 rounded-lg border border-border">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-gold" />
                    <p className="text-sm text-muted-foreground">Waiting for you to click the link...</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setMagicLinkSent(false)}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Didn't receive it? Try again
                </button>
              </motion.form>
            )}

          </AnimatePresence>

          {/* New user */}
          <div className="text-center pt-8">
            <button
              onClick={() => navigate('/start')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              New here? <span className="text-gold">Create a profile</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
