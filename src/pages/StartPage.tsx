import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, User, Ticket, Users, Mail, Lock, Swords, Scale, Check, Eye, EyeOff, Zap, ChevronDown, Copy, AlertTriangle } from 'lucide-react';
import GateIcon from '@/components/loopgate/GateIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTempProfile } from '@/hooks/useTempProfile';
import authCollageBg from '@/assets/auth-collage-bg.jpg';
import loopgateIcon from '@/assets/loopgate-logo.png';
import { rememberAccount } from '@/lib/rememberedAccounts';
import { useAuth } from '@/hooks/useAuth';

type UserRole = 'editor' | 'judge';

interface FormData {
  role: UserRole | null;
  username: string;
  email: string;
  password: string;
  inviteCode: string;
}

const STEPS = [{ id: 'signup', title: 'Sign Up' }];

export default function StartPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setProfile: setTempProfile } = useTempProfile();
  const { signInAsGuest } = useAuth();
  const returnTo = searchParams.get('returnTo');
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  // 'guest' = nickname-only zero-friction entry (default)
  // 'full'  = existing email + password signup form
  const [mode, setMode] = useState<'guest' | 'full'>(
    searchParams.get('full') === '1' ? 'full' : 'guest'
  );
  const [guestNickname, setGuestNickname] = useState('');
  const [guestError, setGuestError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [codeInfo, setCodeInfo] = useState<{ type: 'personal' | 'crew'; crewName?: string; inviterName?: string } | null>(null);
  const [isFastPassword, setIsFastPassword] = useState(false);
  const [savedAck, setSavedAck] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    role: 'editor',
    username: '',
    email: '',
    password: '',
    inviteCode: '',
  });

  // Check for invite code in URL params
  useEffect(() => {
    const codeFromUrl = searchParams.get('code') || searchParams.get('invite');
    if (codeFromUrl) {
      setFormData(prev => ({ ...prev, inviteCode: codeFromUrl.toUpperCase() }));
      setShowInviteCode(true);
      validateInviteCode(codeFromUrl.toUpperCase());
    }
  }, [searchParams]);

  const validateInviteCode = async (code: string) => {
    if (!code || code.length < 3) {
      setCodeInfo(null);
      return;
    }

    const { data: invite } = await supabase
      .from('invites')
      .select('inviter_id, status')
      .eq('invite_code', code.toUpperCase())
      .eq('status', 'pending')
      .maybeSingle();

    if (invite) {
      const { data: inviter } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', invite.inviter_id)
        .single();
      
      setCodeInfo({ type: 'personal', inviterName: inviter?.username });
      return;
    }

    const { data: crew } = await supabase
      .from('crews')
      .select('id, name')
      .ilike('name', code.replace(/-/g, ' '))
      .maybeSingle();

    if (crew) {
      setCodeInfo({ type: 'crew', crewName: crew.name });
      return;
    }

    setCodeInfo(null);
  };

  const validateUsername = async (name: string): Promise<boolean> => {
    if (name.length < 3) {
      setErrors(prev => ({ ...prev, username: 'At least 3 characters' }));
      return false;
    }
    if (name.length > 20) {
      setErrors(prev => ({ ...prev, username: '20 characters max' }));
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
      setErrors(prev => ({ ...prev, username: 'Letters, numbers, underscores only' }));
      return false;
    }

    const { data } = await supabase
      .from('profiles')
      .select('id, email')
      .ilike('username', name)
      .maybeSingle();

    if (data) {
      if (data.email) {
        setErrors(prev => ({ ...prev, username: 'Taken — try signing in' }));
      } else {
        setErrors(prev => ({ ...prev, username: 'Username taken' }));
      }
      return false;
    }

    setErrors(prev => ({ ...prev, username: '' }));
    return true;
  };

  const validateEmail = (email: string): boolean => {
    if (!email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrors(prev => ({ ...prev, email: 'Enter a valid email' }));
      return false;
    }
    setErrors(prev => ({ ...prev, email: '' }));
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (password.length < 6) {
      setErrors(prev => ({ ...prev, password: 'At least 6 characters' }));
      return false;
    }
    setErrors(prev => ({ ...prev, password: '' }));
    return true;
  };

  const handleNext = async () => {
    setLoading(true);
    
    try {
      const usernameValid = await validateUsername(formData.username.trim());
      if (!usernameValid) {
        setLoading(false);
        return;
      }
      const passwordValid = validatePassword(formData.password);
      if (!passwordValid) {
        setLoading(false);
        return;
      }
      if (isFastPassword && !savedAck) {
        toast.error('Please confirm you saved your password');
        setLoading(false);
        return;
      }
      if (formData.email) {
        const emailValid = validateEmail(formData.email.trim());
        if (!emailValid) {
          setLoading(false);
          return;
        }
      }
      await createAccount();
    } finally {
      setLoading(false);
    }
  };

  const generateFastPassword = () => {
    const words = ['loop','edit','wave','beat','flame','tiger','neon','rapid','pulse','storm','blaze','swift','cobra','vortex','echo','bolt','shadow','rogue'];
    const w1 = words[Math.floor(Math.random() * words.length)];
    const w2 = words[Math.floor(Math.random() * words.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    const pw = `${w1}-${w2}-${num}`;
    setFormData(prev => ({ ...prev, password: pw }));
    setIsFastPassword(true);
    setSavedAck(false);
    setCopied(false);
    setShowPassword(true);
    setErrors(prev => ({ ...prev, password: '' }));
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(formData.password);
      setCopied(true);
      toast.success('Password copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy');
    }
  };

  const createAccount = async () => {
    setLoading(true);
    
    try {
      const hasEmail = formData.email.trim().length > 0;
      
      if (hasEmail) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              username: formData.username.trim(),
            },
          },
        });

        if (authError) {
          if (authError.message.includes('already registered')) {
            setErrors(prev => ({ ...prev, email: 'Email already registered' }));
          } else {
            toast.error(authError.message);
          }
          return;
        }

        if (!authData.user) {
          toast.error('Something went wrong');
          return;
        }

        await updateProfileAndRedeem(authData.user.id);
        rememberAccount({ username: formData.username.trim(), email: formData.email.trim().toLowerCase(), password: formData.password });
      } else {
        const placeholderEmail = `${formData.username.trim().toLowerCase()}@loopgate.local`;
        
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: placeholderEmail,
          password: formData.password,
          options: {
            data: {
              username: formData.username.trim(),
              is_username_only: true,
            },
          },
        });

        if (authError) {
          if (authError.message.includes('already registered')) {
            const suffix = Math.random().toString(36).substring(2, 8);
            const altEmail = `${formData.username.trim().toLowerCase()}_${suffix}@loopgate.local`;
            
            const { data: retryData, error: retryError } = await supabase.auth.signUp({
              email: altEmail,
              password: formData.password,
              options: {
                data: {
                  username: formData.username.trim(),
                  is_username_only: true,
                },
              },
            });
            
            if (retryError) {
              toast.error('Failed to create account');
              return;
            }
            
            if (!retryData.user) {
              toast.error('Something went wrong');
              return;
            }
            
            await updateProfileAndRedeem(retryData.user.id);
            rememberAccount({ username: formData.username.trim(), email: altEmail, password: formData.password });
            return;
          }
          
          toast.error(authError.message);
          return;
        }

        if (!authData.user) {
          toast.error('Something went wrong');
          return;
        }

        await updateProfileAndRedeem(authData.user.id);
        rememberAccount({ username: formData.username.trim(), email: placeholderEmail, password: formData.password });
      }
    } catch (err) {
      console.error('Account creation error:', err);
      toast.error('Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const updateProfileAndRedeem = async (userId: string) => {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        username: formData.username.trim(),
        onboarding_completed: true,
        rules_accepted: true,
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Profile update error:', profileError);
    }

    // Handle invite code redemption
    if (formData.inviteCode && codeInfo) {
      if (codeInfo.type === 'personal') {
        await supabase.rpc('redeem_invite', {
          p_code: formData.inviteCode,
          p_user_id: userId,
        });
      } else if (codeInfo.type === 'crew') {
        const { data: crew } = await supabase
          .from('crews')
          .select('id, name')
          .ilike('name', formData.inviteCode.replace(/-/g, ' '))
          .maybeSingle();
        
        if (crew) {
          await supabase.from('crew_members').insert({
            crew_id: crew.id,
            user_id: userId,
            role: 'member',
          });
          await supabase.rpc('award_xp', {
            p_user_id: userId,
            p_amount: 15,
            p_action: 'join_crew',
            p_description: `Joined ${crew.name}`,
          });
        }
      }
    }

    // Handle pending crew invite from localStorage
    const pendingCrewInvite = localStorage.getItem('pending_crew_invite');
    if (pendingCrewInvite) {
      try {
        const { crewId, crewName, via } = JSON.parse(pendingCrewInvite);
        if (crewId) {
          const { data: existing } = await supabase
            .from('crew_members')
            .select('id')
            .eq('crew_id', crewId)
            .eq('user_id', userId)
            .maybeSingle();

          if (!existing) {
            const { data: crew } = await supabase
              .from('crews')
              .select('id, name, join_type')
              .eq('id', crewId)
              .single();

            if (crew && crew.join_type !== 'invite_only') {
              await supabase.from('crew_members').insert({
                crew_id: crewId,
                user_id: userId,
                role: 'member',
              });

              await supabase.rpc('award_xp', {
                p_user_id: userId,
                p_amount: 15,
                p_action: 'join_crew',
                p_description: `Joined ${crew.name}`,
              });

              if (via) {
                const { data: referrer } = await supabase
                  .from('profiles')
                  .select('id')
                  .eq('username', via)
                  .single();

                if (referrer) {
                  await supabase.rpc('award_xp', {
                    p_user_id: referrer.id,
                    p_amount: 50,
                    p_action: 'crew_recruit',
                    p_description: `Recruited member to ${crew.name}`,
                  });
                }
              }

              const { data: newProfile } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', userId)
                .single();

              if (newProfile) {
                await supabase.from('activity_feed').insert({
                  activity_type: 'crew_join',
                  user_id: userId,
                  username: newProfile.username,
                  avatar_url: newProfile.avatar_url,
                  title: `Joined ${crew.name}`,
                  description: via ? `via @${via}'s invite link` : 'Joined the unit',
                  data: {
                    crew_id: crewId,
                    crew_name: crew.name,
                    referrer: via || null,
                  },
                });
              }
            }
          }
        }
      } catch (e) {
        console.error('Error processing pending crew invite:', e);
      }
      localStorage.removeItem('pending_crew_invite');
    }

    showSuccessToast();
    sessionStorage.setItem('loopgate_just_signed_up', '1');

    if (formData.role === 'judge') {
      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: userId,
        role: 'trial_judge',
      });
      
      if (roleError) {
        console.error('Failed to assign trial_judge role:', roleError);
      }
      
      navigate('/judges/apply');
    } else {
      navigate(returnTo || '/hub');
    }
  };

  const showSuccessToast = () => {
    if (codeInfo?.inviterName) {
      toast.success(`Welcome, ${formData.username}!`, {
        description: `Invited by ${codeInfo.inviterName}`,
      });
    } else if (codeInfo?.crewName) {
      toast.success(`Welcome, ${formData.username}!`, {
        description: `Joined ${codeInfo.crewName}`,
      });
    } else {
      toast.success(`Welcome to Loopgate, ${formData.username}!`);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const canProceed = () => {
    return formData.username.trim().length >= 3 && formData.password.length >= 6;
  };

  return (
    <div className="fixed inset-0 overflow-hidden font-apple">
      {/* Translucent backdrop — Hub preview vibe (no opaque black trap) */}
      <div className="absolute inset-0 -z-10">
        {/* Iframe-free Hub vibe: layered cinematic gradients + grain */}
        <div className="absolute inset-0 bg-[#0A0A0A]" />
        {/* Poster collage peek */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-55"
          style={{ backgroundImage: `url(${authCollageBg})` }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.7) 100%)' }} />
        <div className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full opacity-60"
             style={{ background: 'radial-gradient(circle, rgba(212,168,87,0.22), transparent 60%)' }} />
        <div className="absolute -bottom-40 -right-24 w-[600px] h-[600px] rounded-full opacity-50"
             style={{ background: 'radial-gradient(circle, rgba(10,132,255,0.18), transparent 60%)' }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full opacity-40"
             style={{ background: 'radial-gradient(circle, rgba(255,45,85,0.14), transparent 65%)' }} />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.06]"
             style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        {/* Heavy blur veil */}
        <div className="absolute inset-0 backdrop-blur-2xl" style={{ background: 'rgba(8,8,10,0.35)' }} />
      </div>

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-5"
           style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 14px)' }}>
        <button
          onClick={() => navigate('/')}
          className="h-9 w-9 rounded-full flex items-center justify-center bg-white/[0.08] backdrop-blur-xl border border-white/10 active:scale-95 transition"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4 text-white" />
        </button>
        <div />
        <div className="h-9 w-9" />
      </div>

      {/* Scrollable content */}
      <main className="absolute inset-0 overflow-y-auto overscroll-contain"
            style={{ WebkitOverflowScrolling: 'touch', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 72px)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
        <div className="px-5 mx-auto w-full max-w-[420px]">
          {/* Glass card */}
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-[28px] overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(28,28,30,0.72) 0%, rgba(20,20,22,0.62) 100%)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 30px 80px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            <div className="px-6 pt-7 pb-6">
              {/* Hero */}
              <div className="mb-6">
                <img
                  src={loopgateIcon}
                  alt="Loopgate"
                  className="h-12 w-12 mb-4 rounded-[12px] object-contain"
                  style={{ filter: 'drop-shadow(0 8px 20px rgba(212,168,87,0.35))' }}
                />
                <p className="text-[11px] font-semibold tracking-[0.22em] text-[#D4A857] uppercase mb-2">Step Inside</p>
                <h1 className="text-white text-[34px] leading-[1.05] font-bold tracking-[-0.03em]">
                  Create your<br/>handle.
                </h1>
                <p className="text-white/55 text-[14px] mt-2 leading-snug tracking-[-0.01em]">
                  Two fields. You're in the Hub in seconds.
                </p>
              </div>

              {/* Username */}
              <div className="space-y-2 mb-3">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35 text-[15px] font-medium select-none">@</span>
                  <Input
                    value={formData.username}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, username: e.target.value.replace(/^@/, '') }));
                      setErrors(prev => ({ ...prev, username: '' }));
                    }}
                    placeholder="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoFocus
                    maxLength={20}
                    className="h-14 pl-9 pr-4 rounded-2xl border-0 text-[17px] text-white placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-[#D4A857] tracking-[-0.01em]"
                    style={{ background: 'rgba(255,255,255,0.06)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)' }}
                  />
                </div>
                {errors.username && (
                  <p className="text-[12px] text-[#FF453A] pl-1">{errors.username}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-end px-1 -mb-1">
                  {!isFastPassword && (
                    <button
                      type="button"
                      onClick={generateFastPassword}
                      className="flex items-center gap-1 text-[12px] font-semibold text-[#D4A857] active:opacity-60"
                    >
                      <Zap className="w-3 h-3 fill-[#D4A857]" />
                      Use fast password
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/35" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, password: e.target.value }));
                      setErrors(prev => ({ ...prev, password: '' }));
                      if (isFastPassword) { setIsFastPassword(false); setSavedAck(false); }
                    }}
                    placeholder="password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className="h-14 pl-11 pr-20 rounded-2xl border-0 text-[17px] text-white placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-[#D4A857] tracking-[-0.01em]"
                    style={{ background: 'rgba(255,255,255,0.06)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)', fontFamily: isFastPassword ? 'ui-monospace, SFMono-Regular, monospace' : undefined, letterSpacing: isFastPassword ? '0.02em' : undefined }}
                  />
                  {isFastPassword && (
                    <button
                      type="button"
                      onClick={copyPassword}
                      className="absolute right-12 top-1/2 -translate-y-1/2 h-9 w-9 rounded-xl flex items-center justify-center text-white/70 active:bg-white/10"
                      aria-label="Copy password"
                    >
                      {copied ? <Check className="h-4 w-4 text-[#30D158]" /> : <Copy className="h-4 w-4" />}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-xl flex items-center justify-center text-white/55 active:bg-white/10"
                    aria-label="Toggle password"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[12px] text-[#FF453A] pl-1">{errors.password}</p>
                )}
                {isFastPassword && (
                  <div className="mt-2 rounded-2xl p-3 space-y-2.5" style={{ background: 'rgba(212, 168, 87, 0.10)', border: '1px solid rgba(212, 168, 87, 0.35)' }}>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#D4A857] shrink-0 mt-0.5" />
                      <p className="text-[12px] leading-snug text-white/90">
                        <span className="font-semibold">Save this password now.</span> Screenshot it or copy it — you'll need it to log back in.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSavedAck(v => !v)}
                      className="w-full flex items-center gap-2 active:opacity-60"
                    >
                      <span className={`w-[18px] h-[18px] rounded-[5px] flex items-center justify-center shrink-0 transition-colors ${
                        savedAck ? 'bg-[#D4A857] border border-[#D4A857]' : 'bg-white/[0.04] border border-white/20'
                      }`}>
                        {savedAck && (
                          <Check className="w-3 h-3 text-black" strokeWidth={3} />
                        )}
                      </span>
                      <span className="text-[12px] text-white/85 text-left">
                        I saved my password (screenshot or copy)
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Primary CTA */}
              <button
                onClick={handleNext}
                disabled={loading || !canProceed()}
                className="mt-5 w-full h-14 rounded-2xl text-[17px] font-bold tracking-[-0.01em] flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
                style={{
                  background: canProceed()
                    ? 'linear-gradient(180deg, #E8C271 0%, #C99A45 100%)'
                    : 'rgba(255,255,255,0.08)',
                  color: canProceed() ? '#1a1306' : 'rgba(255,255,255,0.5)',
                  boxShadow: canProceed() ? '0 10px 30px -8px rgba(212,168,87,0.55), inset 0 1px 0 rgba(255,255,255,0.4)' : 'none',
                }}
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                ) : (
                  <>
                    Enter the Hub
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>

              {/* Optional reveal */}
              <button
                type="button"
                onClick={() => setShowInviteCode(!showInviteCode)}
                className="mt-4 mx-auto flex items-center gap-1.5 text-[12px] text-white/45 hover:text-white/70 transition-colors"
              >
                <span>Add email or invite code</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${showInviteCode ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showInviteCode && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 space-y-2">
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/35" />
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, email: e.target.value }));
                            setErrors(prev => ({ ...prev, email: '' }));
                          }}
                          placeholder="email (recovery)"
                          className="h-12 pl-11 pr-4 rounded-2xl border-0 text-[15px] text-white placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-[#D4A857]"
                          style={{ background: 'rgba(255,255,255,0.06)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)' }}
                        />
                      </div>
                      {errors.email && <p className="text-[12px] text-[#FF453A] pl-1">{errors.email}</p>}
                      <div className="relative">
                        <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/35" />
                        <Input
                          value={formData.inviteCode}
                          onChange={(e) => {
                            const code = e.target.value.toUpperCase();
                            setFormData(prev => ({ ...prev, inviteCode: code }));
                            validateInviteCode(code);
                          }}
                          placeholder="INVITE CODE"
                          className="h-12 pl-11 pr-4 rounded-2xl border-0 text-[15px] text-white placeholder:text-white/30 uppercase tracking-[0.18em] focus-visible:ring-1 focus-visible:ring-[#D4A857]"
                          style={{ background: 'rgba(255,255,255,0.06)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)' }}
                          maxLength={20}
                        />
                      </div>
                      {codeInfo && (
                        <div className="flex items-center gap-2 text-[12px] text-[#D4A857] pl-1">
                          {codeInfo.type === 'personal' ? (
                            <><Zap className="h-3 w-3" /><span>Invited by {codeInfo.inviterName} — bonus XP</span></>
                          ) : (
                            <><Users className="h-3 w-3" /><span>Joining {codeInfo.crewName} — bonus XP</span></>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Sign in link */}
          <div className="text-center mt-6">
            <button
              onClick={() => navigate('/login')}
              className="text-[13px] text-white/50 active:text-white/80 transition-colors"
            >
              Already have an account? <span className="text-[#D4A857] font-semibold">Sign in</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
