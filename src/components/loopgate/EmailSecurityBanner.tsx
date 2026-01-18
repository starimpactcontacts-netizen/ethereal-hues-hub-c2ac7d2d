import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Shield, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function EmailSecurityBanner() {
  const { user, profile, refreshProfile } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if user has a real email (not a placeholder @loopgate.local)
  const userEmail = user?.email || '';
  const hasRealEmail = userEmail && !userEmail.endsWith('@loopgate.local');

  // Don't show if user has real email or banner dismissed
  if (hasRealEmail || dismissed || !user) return null;

  const handleAddEmail = async () => {
    if (!email.trim()) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error('Enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      // Update the user's email in Supabase Auth
      const { error } = await supabase.auth.updateUser({
        email: email.trim().toLowerCase(),
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('This email is already in use');
        } else {
          toast.error(error.message);
        }
        return;
      }

      // Also update in profile for display
      await supabase
        .from('profiles')
        .update({ email: email.trim().toLowerCase() })
        .eq('id', user.id);

      toast.success('Email added! Check your inbox to confirm.');
      setDismissed(true);
      refreshProfile();
    } catch (err) {
      toast.error('Failed to add email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mx-4 mt-4 p-4 rounded-xl bg-surface-1 border border-gold/20 relative"
      >
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="p-2 rounded-lg bg-gold/10">
            <Shield className="h-5 w-5 text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">Secure Your Account</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Add an email to recover your account if you forget your password or want to sign in on another device.
            </p>

            <AnimatePresence mode="wait">
              {showInput ? (
                <motion.div
                  key="input"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 flex gap-2"
                >
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="pl-9 h-10 bg-surface-2 border-border text-sm"
                      autoFocus
                    />
                  </div>
                  <Button
                    onClick={handleAddEmail}
                    disabled={loading || !email.trim()}
                    size="sm"
                    className="h-10 bg-gold hover:bg-gold/90 text-gold-foreground"
                  >
                    {loading ? (
                      <div className="h-4 w-4 border-2 border-gold-foreground/30 border-t-gold-foreground rounded-full animate-spin" />
                    ) : (
                      'Add'
                    )}
                  </Button>
                </motion.div>
              ) : (
                <motion.button
                  key="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowInput(true)}
                  className="mt-3 flex items-center gap-1 text-xs font-medium text-gold hover:text-gold/80 transition-colors"
                >
                  Add Email
                  <ArrowRight className="h-3 w-3" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
