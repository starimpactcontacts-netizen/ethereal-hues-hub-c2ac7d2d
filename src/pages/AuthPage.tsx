import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, Loader2, Eye, EyeOff, Sparkles } from 'lucide-react';
import { z } from 'zod';
import SEO, { pageSEO } from '@/components/SEO';
import { isNativeApp } from '@/lib/native';
import { supabase } from '@/integrations/supabase/client';
import loopgateLogo from '@/assets/loopgate-logo.png';

const emailSchema = z.string().email('Enter a valid email');
const passwordSchema = z.string().min(8, 'Min 8 characters');

type AuthMode = 'magic' | 'password' | 'magic-sent';

export default function AuthPage() {
  // DEV MODE: immediate redirect
  if (typeof window !== 'undefined' && (window as any).__LOOPGATE_DEV_AUTH__) {
    window.location.href = '/hub';
    return null;
  }

  const { signInWithMagicLink, signInWithPassword, signUpWithPassword, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>('magic');
  const [isNewUser, setIsNewUser] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/hub', { replace: true });
    }
  }, [user, navigate]);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast.error('Enter a valid email');
      return;
    }

    setIsLoading(true);
    const { error } = await signInWithMagicLink(email);
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      setMode('magic-sent');
    }
  };

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast.error('Enter a valid email');
      return;
    }
    
    const passResult = passwordSchema.safeParse(password);
    if (!passResult.success) {
      toast.error(passResult.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    if (isNewUser) {
      const { error } = await signUpWithPassword(email, password);
      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Email already registered. Try signing in.');
          setIsNewUser(false);
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Account created!');
      }
    } else {
      const { error } = await signInWithPassword(email, password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Wrong email or password');
        } else {
          toast.error(error.message);
        }
      }
    }

    setIsLoading(false);
  };

  const handleGuestMode = () => {
    // Just go to hub - protected routes will handle limiting access
    navigate('/hub');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <SEO {...pageSEO.login} />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src={loopgateLogo} 
            alt="Loopgate" 
            className="w-16 h-16 mx-auto mb-4"
          />
          <h1 className="font-display text-2xl text-foreground">Enter</h1>
          <p className="text-muted-foreground text-sm mt-1">Access the arena</p>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'magic-sent' ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-gold/10 border border-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-gold" />
              </div>
              <h3 className="font-display text-xl mb-2">Check your email</h3>
              <p className="text-muted-foreground text-sm mb-6">
                We sent a magic link to <span className="text-foreground">{email}</span>
              </p>
              <p className="text-muted-foreground/60 text-xs">Click the link to sign in instantly</p>
              <Button
                variant="ghost"
                onClick={() => setMode('magic')}
                className="mt-6 text-muted-foreground"
              >
                Use different email
              </Button>
            </motion.div>
          ) : mode === 'magic' ? (
            <motion.div
              key="magic"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Magic Link Form - EASIEST */}
              <form onSubmit={handleMagicLink} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 bg-surface-0 border-border text-base text-center"
                  autoFocus
                />
                
                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gold hover:bg-gold/90 text-gold-foreground font-display text-lg h-14"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Mail className="mr-2 w-5 h-5" />
                      Send Magic Link
                    </>
                  )}
                </Button>
              </form>

              <p className="text-center text-muted-foreground/60 text-xs mt-4">
                No password needed. We'll email you a link.
              </p>

              {/* Alternative: Password */}
              <div className="mt-8 pt-6 border-t border-border/30">
                <button
                  type="button"
                  onClick={() => setMode('password')}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Or use password instead
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="password"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Password Form */}
              <form onSubmit={handlePasswordAuth} className="space-y-3">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-surface-0 border-border text-base"
                />
                
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 bg-surface-0 border-border pr-12 text-base"
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
                  className="w-full bg-gold hover:bg-gold/90 text-gold-foreground font-display h-12"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {isNewUser ? 'Create Account' : 'Sign In'}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setIsNewUser(!isNewUser)}
                  className="text-sm text-muted-foreground hover:text-gold transition-colors"
                >
                  {isNewUser ? 'Already have account? Sign in' : "New here? Create account"}
                </button>
              </div>

              {/* Back to magic link */}
              <div className="mt-6 pt-6 border-t border-border/30">
                <button
                  type="button"
                  onClick={() => setMode('magic')}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back to magic link
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Guest Mode */}
        {mode !== 'magic-sent' && (
          <div className="mt-8">
            <Button
              variant="ghost"
              onClick={handleGuestMode}
              className="w-full text-muted-foreground hover:text-foreground h-12"
            >
              <Sparkles className="mr-2 w-4 h-4" />
              Browse as Guest
            </Button>
            <p className="text-center text-muted-foreground/40 text-xs mt-2">
              Look around first, sign up when ready
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
