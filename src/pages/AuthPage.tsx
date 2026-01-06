import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';
import SEO, { pageSEO } from '@/components/SEO';

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
    navigate('/hub');
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <SEO {...pageSEO.login} />
      
      {/* Radial vignette background */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(30,30,30,0.4) 0%, rgba(0,0,0,1) 70%)'
        }}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Giant LOOPGATE text */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center font-display text-6xl sm:text-7xl md:text-8xl tracking-tight text-white mb-12"
          style={{ 
            textShadow: '0 4px 30px rgba(255,255,255,0.1)',
            letterSpacing: '-0.02em'
          }}
        >
          LOOPGATE
        </motion.h1>

        <AnimatePresence mode="wait">
          {mode === 'magic-sent' ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center py-8"
            >
              <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-display text-2xl text-white mb-3">CHECK YOUR EMAIL</h3>
              <p className="text-white/50 text-sm mb-6">
                Link sent to <span className="text-white">{email}</span>
              </p>
              <button
                onClick={() => setMode('magic')}
                className="text-white/40 hover:text-white text-sm transition-colors"
              >
                Use different email
              </button>
            </motion.div>
          ) : mode === 'magic' ? (
            <motion.div
              key="magic"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <form onSubmit={handleMagicLink} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 bg-white/5 border-white/10 text-white text-center text-lg placeholder:text-white/30 focus:border-white/30 focus:ring-0"
                  autoFocus
                />
                
                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-white hover:bg-white/90 text-black font-display text-lg h-14 tracking-wide"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'SEND LINK'
                  )}
                </Button>
              </form>

              <p className="text-center text-white/30 text-xs mt-4">
                No password. We'll email you a login link.
              </p>

              <div className="mt-10 flex items-center justify-center gap-6">
                <button
                  type="button"
                  onClick={() => setMode('password')}
                  className="text-sm text-white/40 hover:text-white transition-colors"
                >
                  Use password
                </button>
                <span className="text-white/20">•</span>
                <button
                  type="button"
                  onClick={handleGuestMode}
                  className="text-sm text-white/40 hover:text-white transition-colors"
                >
                  Browse as guest
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="password"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <form onSubmit={handlePasswordAuth} className="space-y-3">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  className="w-full bg-white hover:bg-white/90 text-black font-display h-12 tracking-wide"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    isNewUser ? 'CREATE ACCOUNT' : 'SIGN IN'
                  )}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setIsNewUser(!isNewUser)}
                  className="text-sm text-white/40 hover:text-white transition-colors"
                >
                  {isNewUser ? 'Already have account? Sign in' : "New? Create account"}
                </button>
              </div>

              <div className="mt-8 flex items-center justify-center gap-6">
                <button
                  type="button"
                  onClick={() => setMode('magic')}
                  className="text-sm text-white/40 hover:text-white transition-colors"
                >
                  ← Magic link
                </button>
                <span className="text-white/20">•</span>
                <button
                  type="button"
                  onClick={handleGuestMode}
                  className="text-sm text-white/40 hover:text-white transition-colors"
                >
                  Browse as guest
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
