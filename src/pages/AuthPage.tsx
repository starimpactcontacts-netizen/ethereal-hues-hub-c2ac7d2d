import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import SEO, { pageSEO } from '@/components/SEO';
import loopgateWordmark from '@/assets/loopgate-wordmark.png';
import { supabase } from '@/integrations/supabase/client';

const emailSchema = z.string().email('Enter a valid email');
const passwordSchema = z.string().min(8, 'Min 8 characters');

// Modes: 
// 'choice' - initial screen with New/Login choice
// 'signup-email' - new user enters email for magic link
// 'signup-password' - new user uses password instead
// 'login-email' - returning user enters email for magic link  
// 'login-password' - returning user uses password
// 'login-otp' - returning user enters OTP code
// 'magic-sent' - magic link sent confirmation
type AuthMode = 'choice' | 'signup-email' | 'signup-password' | 'login-email' | 'login-password' | 'login-otp' | 'magic-sent';

// Check if input is an email or username
const isEmail = (value: string) => value.includes('@');

export default function AuthPage() {
  // DEV MODE: immediate redirect
  if (typeof window !== 'undefined' && (window as any).__LOOPGATE_DEV_AUTH__) {
    window.location.href = '/hub';
    return null;
  }

  const { signInWithMagicLink, signInWithPassword, signUpWithPassword, signInWithOtp, user } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState(''); // email or username
  const [resolvedEmail, setResolvedEmail] = useState(''); // for OTP after username lookup
  const [tokenHash, setTokenHash] = useState(''); // for OTP verification
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>('choice');

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/hub', { replace: true });
    }
  }, [user, navigate]);

  // Lookup email by username (case-insensitive)
  const getEmailFromUsername = async (username: string): Promise<{ email: string | null; found: boolean }> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .ilike('username', username)
      .maybeSingle();
    
    if (error || !data) return { email: null, found: false };
    return { email: data.email, found: true };
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let emailToUse = identifier;
    
    // If it's a username (login mode), look up the email
    if (mode === 'login-email' && !isEmail(identifier)) {
      const result = await getEmailFromUsername(identifier);
      if (!result.found || !result.email) {
        toast.error('Username not found');
        return;
      }
      emailToUse = result.email;
    } else {
      const result = emailSchema.safeParse(identifier);
      if (!result.success) {
        toast.error('Enter a valid email');
        return;
      }
    }

    setIsLoading(true);
    const result = await signInWithMagicLink(emailToUse);
    setIsLoading(false);

    if (result.error) {
      toast.error(result.error.message);
    } else {
      setResolvedEmail(emailToUse);
      if (result.tokenHash) setTokenHash(result.tokenHash);
      setMode('magic-sent');
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otpCode.length < 6) {
      toast.error('Enter the full code');
      return;
    }

    setIsLoading(true);
    // Use tokenHash for verification (PKCE flow)
    const { error } = await signInWithOtp(resolvedEmail, otpCode, tokenHash);
    setIsLoading(false);

    if (error) {
      toast.error('Invalid or expired code');
    } else {
      toast.success('Signed in!');
    }
  };

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isSignup = mode === 'signup-password';
    let emailToUse = identifier;
    
    // For login, support username
    if (!isSignup && !isEmail(identifier)) {
      const result = await getEmailFromUsername(identifier);
      if (!result.found || !result.email) {
        toast.error('Username not found');
        return;
      }
      emailToUse = result.email;
    } else {
      const emailResult = emailSchema.safeParse(identifier);
      if (!emailResult.success) {
        toast.error('Enter a valid email');
        return;
      }
    }
    
    const passResult = passwordSchema.safeParse(password);
    if (!passResult.success) {
      toast.error(passResult.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    if (isSignup) {
      const { error } = await signUpWithPassword(emailToUse, password);
      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Email already registered. Try signing in.');
          setMode('login-password');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Account created!');
      }
    } else {
      const { error } = await signInWithPassword(emailToUse, password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Wrong credentials');
        } else {
          toast.error(error.message);
        }
      }
    }

    setIsLoading(false);
  };

  const handleGuestMode = () => {
    navigate('/hub');
  };

  const goBack = () => {
    if (mode === 'signup-password') setMode('signup-email');
    else if (mode === 'login-password') setMode('login-email');
    else if (mode === 'magic-sent') {
      setOtpCode('');
      setMode('login-email');
    }
    else setMode('choice');
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <SEO {...pageSEO.login} />
      
      {/* Radial vignette background */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(40,40,40,0.5) 0%, rgba(0,0,0,1) 70%)'
        }}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Back button when not on choice screen */}
        {mode !== 'choice' && (
          <button
            onClick={goBack}
            className="absolute -top-12 left-0 text-white/40 hover:text-white flex items-center gap-1 text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        )}

        {/* LOOPGATE Logo */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center mb-10"
        >
          <img 
            src={loopgateWordmark} 
            alt="LOOPGATE" 
            className="h-16 sm:h-20 w-auto"
          />
        </motion.div>

        <AnimatePresence mode="wait">
          {/* INITIAL CHOICE: New or Returning */}
          {mode === 'choice' && (
            <motion.div
              key="choice"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <Button 
                onClick={() => setMode('signup-email')}
                className="w-full bg-white hover:bg-white/90 text-black font-bold text-lg h-14 tracking-wide"
              >
                NEW HERE
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              
              <Button 
                onClick={() => setMode('login-email')}
                variant="outline"
                className="w-full border-white/20 bg-transparent hover:bg-white/5 text-white font-bold text-lg h-14 tracking-wide"
              >
                I HAVE AN ACCOUNT
              </Button>

              <div className="pt-6 text-center">
                <button
                  onClick={handleGuestMode}
                  className="text-white/30 hover:text-white/60 text-sm transition-colors"
                >
                  Just browsing? Enter as guest
                </button>
              </div>
            </motion.div>
          )}

          {/* MAGIC LINK SENT */}
          {mode === 'magic-sent' && (
            <motion.div
              key="sent"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center py-4"
            >
              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl text-white font-bold mb-2">CHECK YOUR EMAIL</h3>
              <p className="text-white/50 text-sm mb-6">
                We sent a code to <span className="text-white">{resolvedEmail || identifier}</span>
              </p>

              {/* OTP Input */}
              <form onSubmit={handleOtpVerify} className="space-y-4">
                <div>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8))}
                    className="h-14 bg-white/5 border-white/10 text-white text-center text-2xl tracking-[0.3em] placeholder:text-white/30 placeholder:tracking-normal placeholder:text-base focus:border-white/30 focus:ring-0 font-mono uppercase"
                    autoFocus
                  />
                </div>
                
                <Button 
                  type="submit"
                  disabled={isLoading || otpCode.length < 6}
                  className="w-full bg-white hover:bg-white/90 text-black font-bold h-12"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'VERIFY CODE'}
                </Button>
              </form>

              <p className="text-white/30 text-xs mt-4">
                Or click the magic link in your email
              </p>

              <button
                onClick={() => {
                  setOtpCode('');
                  setMode('choice');
                }}
                className="text-white/40 hover:text-white text-sm transition-colors mt-4"
              >
                Start over
              </button>
            </motion.div>
          )}

          {/* SIGNUP - EMAIL (Magic Link) */}
          {mode === 'signup-email' && (
            <motion.div
              key="signup-email"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <p className="text-white/50 text-center text-sm mb-6">Create your account</p>
              
              <form onSubmit={handleMagicLink} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Your email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="h-14 bg-white/5 border-white/10 text-white text-center text-lg placeholder:text-white/30 focus:border-white/30 focus:ring-0"
                  autoFocus
                />
                
                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-white hover:bg-white/90 text-black font-bold text-lg h-14"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SEND MAGIC LINK'}
                </Button>
              </form>

              <p className="text-center text-white/30 text-xs mt-4">
                No password needed. We'll email you a login link.
              </p>

              <div className="mt-8 text-center">
                <button
                  onClick={() => setMode('signup-password')}
                  className="text-white/40 hover:text-white text-sm transition-colors"
                >
                  Prefer a password? Create one instead
                </button>
              </div>
            </motion.div>
          )}

          {/* SIGNUP - PASSWORD */}
          {mode === 'signup-password' && (
            <motion.div
              key="signup-password"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <p className="text-white/50 text-center text-sm mb-6">Create your account with password</p>
              
              <form onSubmit={handlePasswordAuth} className="space-y-3">
                <Input
                  type="email"
                  placeholder="Email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:ring-0"
                />
                
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create password (8+ chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 bg-white/5 border-white/10 text-white pr-12 placeholder:text-white/30 focus:border-white/30 focus:ring-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-white hover:bg-white/90 text-black font-bold h-12"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'CREATE ACCOUNT'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setMode('signup-email')}
                  className="text-white/40 hover:text-white text-sm transition-colors"
                >
                  ← Use magic link instead
                </button>
              </div>
            </motion.div>
          )}

          {/* LOGIN - EMAIL (Magic Link) */}
          {mode === 'login-email' && (
            <motion.div
              key="login-email"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <p className="text-white/50 text-center text-sm mb-6">Welcome back</p>
              
              <form onSubmit={handleMagicLink} className="space-y-4">
                <Input
                  type="text"
                  placeholder="Email or username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="h-14 bg-white/5 border-white/10 text-white text-center text-lg placeholder:text-white/30 focus:border-white/30 focus:ring-0"
                  autoFocus
                />
                
                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-white hover:bg-white/90 text-black font-bold text-lg h-14"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SEND MAGIC LINK'}
                </Button>
              </form>

              <p className="text-center text-white/30 text-xs mt-4">
                We'll email you a login link.
              </p>

              <div className="mt-8 text-center">
                <button
                  onClick={() => setMode('login-password')}
                  className="text-white/40 hover:text-white text-sm transition-colors"
                >
                  Sign in with password instead
                </button>
              </div>
            </motion.div>
          )}

          {/* LOGIN - PASSWORD */}
          {mode === 'login-password' && (
            <motion.div
              key="login-password"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <p className="text-white/50 text-center text-sm mb-6">Sign in with password</p>
              
              <form onSubmit={handlePasswordAuth} className="space-y-3">
                <Input
                  type="text"
                  placeholder="Email or username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:ring-0"
                />
                
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 bg-white/5 border-white/10 text-white pr-12 placeholder:text-white/30 focus:border-white/30 focus:ring-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-white hover:bg-white/90 text-black font-bold h-12"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SIGN IN'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setMode('login-email')}
                  className="text-white/40 hover:text-white text-sm transition-colors"
                >
                  ← Use magic link instead
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
