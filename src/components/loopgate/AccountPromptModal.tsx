import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center font-apple"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md rounded-t-[20px] sm:rounded-[20px] flex flex-col"
            style={{ background: '#1c1c1e', maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - 16px)' }}
          >
            {/* Header */}
            <div className="px-5 pt-3 pb-3 shrink-0 relative">
              <div className="w-9 h-1 rounded-full bg-white/25 mx-auto sm:hidden mb-4" />
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.14] active:bg-white/[0.2] flex items-center justify-center transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
              </button>
              <h2 className="text-[22px] font-bold text-white tracking-[-0.022em] pr-10 pt-1">
                {mode === 'signup' ? 'Save your progress' : 'Welcome back'}
              </h2>
              <p className="text-[14px] text-[#8E8E93] mt-1 leading-snug">{reason}</p>
            </div>

            {/* Content */}
            <div
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-4"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {tempProfile && mode === 'signup' && (
                <div className="rounded-[14px] px-4 py-3 flex items-center justify-between" style={{ background: 'rgba(118,118,128,0.16)' }}>
                  <span className="text-[13px] text-[#8E8E93] font-medium">Creating account for</span>
                  <span className="text-[15px] font-semibold text-[#D4A857] tracking-[-0.01em]">@{tempProfile.username}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[13px] text-[#8E8E93] font-medium px-1">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="h-11 rounded-[10px] border-0 text-[16px] text-white placeholder:text-[#8E8E93] focus-visible:ring-1 focus-visible:ring-[#D4A857]"
                  style={{ background: 'rgba(118, 118, 128, 0.24)' }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] text-[#8E8E93] font-medium px-1">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  className="h-11 rounded-[10px] border-0 text-[16px] text-white placeholder:text-[#8E8E93] focus-visible:ring-1 focus-visible:ring-[#D4A857]"
                  style={{ background: 'rgba(118, 118, 128, 0.24)' }}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full h-12 rounded-[14px] bg-[#D4A857] text-white text-[17px] font-semibold active:opacity-60 disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === 'signup' ? 'Create account' : 'Sign in'}
              </button>

              <button
                onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
                className="w-full h-11 text-[14px] text-[#8E8E93] active:opacity-60"
              >
                {mode === 'signup' ? (
                  <>Already have an account? <span className="text-[#0A84FF] font-medium">Sign in</span></>
                ) : (
                  <>Need an account? <span className="text-[#0A84FF] font-medium">Sign up</span></>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
