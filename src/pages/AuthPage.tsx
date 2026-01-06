import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, ArrowLeft, Loader2, Eye, EyeOff, ChevronDown, User, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import SEO, { pageSEO } from '@/components/SEO';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');

const REMEMBERED_EMAIL_KEY = 'loopgate_remembered_email';

type AuthMode = 'signin' | 'signup' | 'reset' | 'reset-sent' | 'welcome-back';

export default function AuthPage() {
  // DEV MODE: immediate redirect before any React logic
  if (typeof window !== 'undefined' && (window as any).__LOOPGATE_DEV_AUTH__) {
    window.location.href = '/hub';
    return null;
  }

  const { signInWithGoogle, signInWithPassword, signUpWithPassword, resetPassword, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>('signin');
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [rememberedEmail, setRememberedEmail] = useState<string | null>(null);

  // Check for remembered email on mount
  useEffect(() => {
    const stored = localStorage.getItem(REMEMBERED_EMAIL_KEY);
    if (stored) {
      setRememberedEmail(stored);
      setEmail(stored);
      setMode('welcome-back');
    }
  }, []);

  // If already authenticated, redirect to hub
  useEffect(() => {
    if (user) {
      // Save email for next time
      if (email) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
      }
      navigate('/hub', { replace: true });
    }
  }, [user, navigate, email]);

  const clearRememberedEmail = () => {
    localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    setRememberedEmail(null);
    setEmail('');
    setMode('signin');
  };

  const validateInputs = () => {
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast.error(emailResult.error.errors[0].message);
      return false;
    }

    if (mode !== 'reset') {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        toast.error(passwordResult.error.errors[0].message);
        return false;
      }
    }

    if (mode === 'signup' && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error('Failed to sign in with Google');
    }
    setIsLoading(false);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setIsLoading(true);

    if (mode === 'signin' || mode === 'welcome-back') {
      const { error } = await signInWithPassword(email, password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password');
        } else {
          toast.error(error.message);
        }
      } else {
        // Save email for remembered login
        localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
      }
    } else if (mode === 'signup') {
      const { error } = await signUpWithPassword(email, password);
      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('This email is already registered. Try signing in.');
        } else {
          toast.error(error.message);
        }
      } else {
        // Save email for remembered login
        localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
        toast.success('Account created! Redirecting...');
      }
    } else if (mode === 'reset') {
      const { error } = await resetPassword(email);
      if (error) {
        toast.error(error.message);
      } else {
        setMode('reset-sent');
      }
    }

    setIsLoading(false);
  };

  const renderWelcomeBack = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      {/* Avatar placeholder */}
      <div className="w-20 h-20 bg-gradient-to-br from-gold/20 to-gold/5 border-2 border-gold/30 rounded-full flex items-center justify-center mx-auto mb-4">
        <User className="w-10 h-10 text-gold" />
      </div>
      
      <p className="text-muted-foreground text-sm mb-1">Welcome back</p>
      <p className="text-foreground font-medium text-lg mb-6">{rememberedEmail}</p>
      
      <form onSubmit={handleEmailAuth} className="space-y-4">
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-14 bg-surface-0 border-border pr-12 text-center text-lg"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <Button 
          type="submit"
          disabled={isLoading}
          className="w-full bg-gold hover:bg-gold/90 text-gold-foreground font-display text-xl h-14"
        >
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              Log In
              <ArrowRight className="ml-2 w-5 h-5" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 space-y-2">
        <button
          type="button"
          onClick={() => setMode('reset')}
          className="text-sm text-muted-foreground hover:text-gold transition-colors"
        >
          Forgot password?
        </button>
        <div>
          <button
            type="button"
            onClick={clearRememberedEmail}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mx-auto"
          >
            <X size={14} />
            Not you? Sign in with different account
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderForm = () => {
    if (mode === 'welcome-back' && rememberedEmail) {
      return renderWelcomeBack();
    }

    if (mode === 'reset-sent') {
      return (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gold/10 border border-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-gold" />
          </div>
          <h3 className="font-display text-xl mb-2">Check Your Email</h3>
          <p className="text-muted-foreground text-sm mb-6">
            We sent a password reset link to <span className="text-foreground">{email}</span>
          </p>
          <Button 
            variant="outline" 
            onClick={() => setMode('signin')}
            className="border-border"
          >
            Back to sign in
          </Button>
        </div>
      );
    }

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, x: mode === 'signup' ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: mode === 'signup' ? -20 : 20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Email + Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-1">
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 bg-surface-0 border-border text-base"
              />
            </div>
            
            {mode !== 'reset' && (
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 bg-surface-0 border-border pr-12 text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            )}

            {mode === 'signup' && (
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-14 bg-surface-0 border-border text-base"
              />
            )}

            <Button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-gold hover:bg-gold/90 text-gold-foreground font-display text-xl h-14 shadow-lg shadow-gold/20"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  {mode === 'signin' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'reset' && 'Send Reset Link'}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </form>

          {/* Mode Toggles */}
          <div className="mt-6 space-y-3 text-center">
            {mode === 'signin' && (
              <>
                <button
                  type="button"
                  onClick={() => setMode('reset')}
                  className="text-sm text-muted-foreground hover:text-gold transition-colors"
                >
                  Forgot your password?
                </button>
                <p className="text-sm text-muted-foreground">
                  New to Loopgate?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-gold hover:underline font-semibold"
                  >
                    Create account
                  </button>
                </p>
              </>
            )}
            
            {mode === 'signup' && (
              <p className="text-sm text-muted-foreground">
                Already competing?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-gold hover:underline font-semibold"
                >
                  Sign in
                </button>
              </p>
            )}

            {mode === 'reset' && (
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-sm text-muted-foreground hover:text-gold transition-colors"
              >
                Back to sign in
              </button>
            )}
          </div>

          {/* More Options - Hidden Google OAuth */}
          {(mode === 'signin' || mode === 'signup') && (
            <div className="mt-8 pt-6 border-t border-border/50">
              <button
                type="button"
                onClick={() => setShowMoreOptions(!showMoreOptions)}
                className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              >
                <span>More options</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showMoreOptions ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {showMoreOptions && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 overflow-hidden"
                  >
                    <Button 
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                      variant="outline"
                      className="w-full border-border/50 h-11 text-muted-foreground hover:text-foreground"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Continue with Google
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative">
      <SEO {...pageSEO.login} />
      {/* Back to Home */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Home</span>
      </Link>
      
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[120px]" />
      
      <motion.div 
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-display text-5xl text-gold mb-2 tracking-tight">LOOPGATE</h1>
          <p className="text-muted-foreground text-sm">The Global Competitive Editing Index</p>
        </div>

        <div className="bg-surface-1/80 backdrop-blur-sm border border-border/80 p-8 shadow-2xl shadow-black/20">
          {mode !== 'welcome-back' && mode !== 'reset-sent' && (
            <h2 className="font-display text-2xl text-center mb-8">
              {mode === 'signin' && 'Sign In to Compete'}
              {mode === 'signup' && 'Join the Competition'}
              {mode === 'reset' && 'Reset Password'}
            </h2>
          )}

          {renderForm()}
        </div>

        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          By signing in, you agree to Loopgate's Terms and Competition Rules.
        </p>
      </motion.div>
    </div>
  );
}
