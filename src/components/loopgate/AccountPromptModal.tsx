import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTempProfile } from '@/hooks/useTempProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AccountPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: string;
  onSuccess?: () => void;
}

export default function AccountPromptModal({ isOpen, onClose, reason, onSuccess }: AccountPromptModalProps) {
  const navigate = useNavigate();
  const { profile: tempProfile, clearProfile } = useTempProfile();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signup' | 'login'>('signup');

  const handleSubmit = async () => {
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        // Sign up with email/password
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              username: tempProfile?.username,
              region: tempProfile?.region,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          // Update profile with temp data
          if (tempProfile) {
            await supabase
              .from('profiles')
              .update({
                username: tempProfile.username,
                region: tempProfile.region,
                onboarding_completed: true,
              })
              .eq('id', data.user.id);
          }

          clearProfile();
          toast.success('Account created! Welcome to Loopgate.');
          onClose();
          onSuccess?.();
        }
      } else {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        clearProfile();
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md bg-surface-0 border border-border rounded-lg overflow-hidden"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-display text-xl">
                {mode === 'signup' ? 'Save Your Progress' : 'Welcome Back'}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-surface-1 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <p className="text-muted-foreground text-center">
                {reason}
              </p>

              {tempProfile && mode === 'signup' && (
                <div className="bg-surface-1 border border-border rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Creating account for</p>
                  <p className="font-display text-xl text-gold">@{tempProfile.username}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-10 h-12 bg-surface-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 h-12 bg-surface-1"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full h-12 bg-gold hover:bg-gold/90 text-gold-foreground font-display"
                >
                  {loading ? 'Processing...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {mode === 'signup' ? (
                    <>Already have an account? <span className="text-gold">Sign in</span></>
                  ) : (
                    <>Need an account? <span className="text-gold">Sign up</span></>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
