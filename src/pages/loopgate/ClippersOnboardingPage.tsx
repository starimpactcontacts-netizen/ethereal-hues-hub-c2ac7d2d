import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scissors, Check, Loader2, AlertCircle, DollarSign, Trophy, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function ClippersOnboardingPage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [age18, setAge18] = useState(false);
  const [keep30Days, setKeep30Days] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const allChecked = age18 && keep30Days && agreeTerms;
  const isExistingUser = !!user;

  const handleActivate = async () => {
    setError('');

    if (!isExistingUser) {
      if (!username || username.length < 3) {
        setError('Username must be at least 3 characters');
        return;
      }
      if (!password || password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    }

    if (!allChecked) {
      setError('Please agree to all the terms');
      return;
    }

    setLoading(true);

    try {
      let userId = user?.id;

      // New user signup flow
      if (!isExistingUser) {
        // Use a placeholder email if none provided
        const signupEmail = email && email.includes('@')
          ? email.trim()
          : `${username.toLowerCase()}_clipper_${Date.now()}@loopgate.clip`;

        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: signupEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/missions/portal`,
            data: { username: username.toUpperCase() },
          },
        });

        if (signUpErr) {
          setError(signUpErr.message);
          setLoading(false);
          return;
        }

        userId = data.user?.id;

        if (!userId) {
          setError('Could not create account. Try again.');
          setLoading(false);
          return;
        }

        // Create base profile
        await supabase.from('profiles').upsert({
          id: userId,
          username: username.toUpperCase(),
          rules_accepted: true,
          onboarding_completed: true,
        });
      }

      if (!userId) {
        setError('No user. Sign in first.');
        setLoading(false);
        return;
      }

      // Create clipper profile
      const { error: clipperErr } = await supabase
        .from('clipper_profiles')
        .upsert({
          user_id: userId,
          display_name: username ? username.toUpperCase() : null,
          agreed_to_terms: agreeTerms,
          age_confirmed_18_plus: age18,
          agreed_30_day_post: keep30Days,
        });

      if (clipperErr) {
        setError(clipperErr.message);
        setLoading(false);
        return;
      }

      // Add clipper role
      await supabase.from('user_roles').insert({
        user_id: userId,
        role: 'clipper' as never,
      } as never);

      await refreshProfile();
      toast.success("You're a Clipper now. Let's get this bag.");
      navigate('/missions/portal');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface-1 border border-border rounded-full">
            <Scissors className="w-4 h-4 text-gold" />
            <span className="font-display text-xs tracking-widest text-gold">CLIPPERS PORTAL</span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl mb-3">Clip. Post. Earn.</h1>
          <p className="text-muted-foreground text-sm">
            Browse paid campaigns, drop clips, get paid in cash + index points.
          </p>
        </div>

        {/* Perk row */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { icon: DollarSign, label: 'Cash payouts' },
            { icon: Trophy, label: 'Index points' },
            { icon: Zap, label: 'Instant access' },
          ].map((p) => (
            <div key={p.label} className="bg-surface-1 border border-border rounded-lg p-3 flex flex-col items-center gap-1.5">
              <p.icon className="w-4 h-4 text-gold" />
              <span className="text-[10px] text-muted-foreground text-center leading-tight">{p.label}</span>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="bg-surface-1 border border-border rounded-xl p-6 space-y-4">
          {!isExistingUser ? (
            <>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground tracking-wider uppercase">Username</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toUpperCase())}
                  placeholder="YOUR_HANDLE"
                  maxLength={20}
                  className="h-12 bg-surface-0 font-display tracking-wider uppercase"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground tracking-wider uppercase">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 bg-surface-0"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground tracking-wider uppercase">
                  Email <span className="text-muted-foreground/60 normal-case">(optional)</span>
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="for payouts & recovery"
                  className="h-12 bg-surface-0"
                />
              </div>
            </>
          ) : (
            <div className="bg-surface-0 border border-border rounded-lg p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Activating clipper mode for</p>
              <p className="font-display text-lg text-gold">@{user?.email?.split('@')[0]}</p>
            </div>
          )}

          {/* Agreements */}
          <div className="space-y-3 pt-2 border-t border-border">
            <label className="flex items-start gap-3 cursor-pointer group">
              <Checkbox checked={age18} onCheckedChange={(v) => setAge18(!!v)} className="mt-0.5" />
              <span className="text-sm leading-snug text-muted-foreground group-hover:text-foreground transition-colors">
                I confirm I'm <span className="text-foreground font-medium">18 years or older</span>.
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer group">
              <Checkbox checked={keep30Days} onCheckedChange={(v) => setKeep30Days(!!v)} className="mt-0.5" />
              <span className="text-sm leading-snug text-muted-foreground group-hover:text-foreground transition-colors">
                I'll keep my submitted clips live for a <span className="text-foreground font-medium">minimum of 30 days</span>.
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer group">
              <Checkbox checked={agreeTerms} onCheckedChange={(v) => setAgreeTerms(!!v)} className="mt-0.5" />
              <span className="text-sm leading-snug text-muted-foreground group-hover:text-foreground transition-colors">
                I agree to the Loopgate <span className="text-foreground font-medium">Clipper Terms</span> & payout rules.
              </span>
            </label>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <Button
            onClick={handleActivate}
            disabled={loading || !allChecked}
            className="w-full h-12 bg-gold hover:bg-gold/90 text-gold-foreground font-display tracking-wide disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Activate Clipper Account
                <Check className="ml-2 w-4 h-4" />
              </>
            )}
          </Button>

          <p className="text-[11px] text-muted-foreground text-center">
            Earnings are credited to your editor account. You can switch portals anytime.
          </p>
        </div>
      </motion.div>
    </div>
  );
}