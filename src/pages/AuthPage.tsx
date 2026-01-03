import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');

type AuthMode = 'signin' | 'signup' | 'reset' | 'reset-sent';

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

  // If already authenticated, redirect to hub
  useEffect(() => {
    if (user) {
      navigate('/hub', { replace: true });
    }
  }, [user, navigate]);

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

    if (mode === 'signin') {
      const { error } = await signInWithPassword(email, password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password');
        } else {
          toast.error(error.message);
        }
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

  const renderForm = () => {
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
      <>
        {/* Google Sign In */}
        <Button 
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full bg-foreground hover:bg-foreground/90 text-background font-semibold h-12 mb-6"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </>
          )}
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface-1 px-4 text-muted-foreground tracking-widest">
              Or use email
            </span>
          </div>
        </div>

        {/* Email + Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 bg-surface-0 border-border"
          />
          
          {mode !== 'reset' && (
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-surface-0 border-border pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          )}

          {mode === 'signup' && (
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12 bg-surface-0 border-border"
            />
          )}

          <Button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-gold hover:bg-gold/90 text-gold-foreground font-display text-lg h-12"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
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
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-gold hover:underline font-semibold"
                >
                  Sign up
                </button>
              </p>
            </>
          )}
          
          {mode === 'signup' && (
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
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
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-gold/5 rounded-full blur-[100px]" />
      
      <motion.div 
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl text-gold mb-2">LOOPGATE</h1>
          <p className="text-muted-foreground">The Global Competitive Editing Index</p>
        </div>

        <div className="bg-surface-1 border border-border p-8">
          <h2 className="font-display text-2xl text-center mb-8">
            {mode === 'signin' && 'Sign In to Compete'}
            {mode === 'signup' && 'Create Your Account'}
            {mode === 'reset' && 'Reset Password'}
            {mode === 'reset-sent' && 'Check Your Email'}
          </h2>

          {renderForm()}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By signing in, you agree to Loopgate's Terms and Competition Rules.
        </p>
      </motion.div>
    </div>
  );
}
