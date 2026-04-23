import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Loader2, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  reason?: string;
}

/**
 * Frictionless clipper lock-in.
 * Just username + password. Email & socials go in settings later.
 */
export default function ClipperLockGate({ open, onClose, onSuccess, reason }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    setErr('');
    if (!username || username.length < 3) {
      setErr('Username must be at least 3 characters');
      return;
    }
    if (!password || password.length < 6) {
      setErr('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const handle = username.toUpperCase().replace(/[^A-Z0-9_]/g, '');
      const fakeEmail = `${handle.toLowerCase()}_clipper_${Date.now()}@loopgate.clip`;
      const { data, error } = await supabase.auth.signUp({
        email: fakeEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/missions/portal`,
          data: { username: handle },
        },
      });
      if (error) {
        setErr(error.message);
        return;
      }
      const uid = data.user?.id;
      if (!uid) {
        setErr('Could not create account.');
        return;
      }
      await supabase.from('profiles').upsert({
        id: uid,
        username: handle,
        rules_accepted: true,
        onboarding_completed: true,
      });
      await supabase.from('clipper_profiles').upsert({
        user_id: uid,
        display_name: handle,
        agreed_to_terms: true,
        age_confirmed_18_plus: true,
        agreed_30_day_post: true,
      });
      await supabase.from('user_roles').insert({
        user_id: uid,
        role: 'clipper' as never,
      } as never);
      toast.success(`Welcome, @${handle}`);
      onSuccess();
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-sm bg-surface-1 border border-border sm:rounded-2xl rounded-t-3xl p-6 relative pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-surface-0 flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
                <Scissors className="w-5 h-5 text-gold" />
              </div>
            </div>

            <h2 className="font-display text-2xl text-center mb-1">Lock in your handle</h2>
            <p className="text-sm text-muted-foreground text-center mb-5">
              {reason || 'Pick a username to save your work and get paid.'}
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-muted-foreground tracking-wider uppercase">
                  Username
                </label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toUpperCase())}
                  placeholder="YOUR_HANDLE"
                  maxLength={20}
                  className="h-12 bg-surface-0 font-display tracking-wider uppercase mt-1"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground tracking-wider uppercase">
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 bg-surface-0 mt-1"
                />
              </div>

              {err && <p className="text-xs text-destructive">{err}</p>}

              <Button
                onClick={submit}
                disabled={loading}
                className="w-full h-12 bg-gold hover:bg-gold/90 text-gold-foreground font-display tracking-wide"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" /> Lock in
                  </>
                )}
              </Button>

              <p className="text-[11px] text-muted-foreground text-center">
                Add your email & socials anytime in Settings.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}