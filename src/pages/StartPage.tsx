import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, User, Ticket, Users, Mail, Lock, Swords, Scale, Check, Eye, EyeOff, Zap, ChevronDown } from 'lucide-react';
import GateIcon from '@/components/loopgate/GateIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTempProfile } from '@/hooks/useTempProfile';
import loopgateLogo from '@/assets/loopgate-wordmark.png';

type UserRole = 'editor' | 'judge';

interface FormData {
  role: UserRole | null;
  username: string;
  email: string;
  password: string;
  inviteCode: string;
}

const STEPS = [
  { id: 'role', title: 'Choose Your Path' },
  { id: 'username', title: 'Claim Your Name' },
  { id: 'account', title: 'Lock It In' },
];

export default function StartPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setProfile: setTempProfile } = useTempProfile();
  const returnTo = searchParams.get('returnTo');
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [codeInfo, setCodeInfo] = useState<{ type: 'personal' | 'crew'; crewName?: string; inviterName?: string } | null>(null);
  
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
      if (step === 0) {
        if (!formData.role) {
          toast.error('Choose a path to continue');
          setLoading(false);
          return;
        }
        setStep(1);
      } else if (step === 1) {
        const isValid = await validateUsername(formData.username.trim());
        if (!isValid) {
          setLoading(false);
          return;
        }
        setStep(2);
      } else if (step === 2) {
        const passwordValid = validatePassword(formData.password);
        if (!passwordValid) {
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
      }
    } finally {
      setLoading(false);
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
    if (step === 0) return !!formData.role;
    if (step === 1) return formData.username.trim().length >= 3;
    if (step === 2) return formData.password.length >= 6;
    return true;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Subtle animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold/5 via-background to-background" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-gold/3 to-transparent" />
      </div>
      
      {/* Header */}
      <div className="relative z-10 p-5 flex items-center justify-between">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity"
        >
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          <img src={loopgateLogo} alt="Loopgate" className="h-5" />
        </button>
        
        {/* Step indicator */}
        <div className="flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 transition-all duration-300 ${
                i === step 
                  ? 'w-6 bg-gold' 
                  : i < step 
                    ? 'w-1.5 bg-gold/50' 
                    : 'w-1.5 bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main content - vertically centered with proper spacing */}
      <div className="relative z-10 flex-1 flex flex-col justify-start pt-8 px-5 pb-4">
        <AnimatePresence mode="wait">
          {/* Step 0: Role Selection */}
          {step === 0 && (
            <motion.div
              key="role"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-md mx-auto"
            >
              <div className="text-center mb-8">
                <h1 className="font-display text-4xl sm:text-5xl tracking-tight mb-2">
                  CHOOSE YOUR PATH
                </h1>
                <p className="text-muted-foreground text-sm">
                  How will you enter the arena?
                </p>
              </div>

              <div className="space-y-3">
                {/* Editor — hero primary choice, pre-selected */}
                <button
                  onClick={() => setFormData(prev => ({ ...prev, role: 'editor' }))}
                  className={`w-full border transition-all duration-200 text-left group relative overflow-hidden ${
                    formData.role === 'editor'
                      ? 'border-gold bg-gradient-to-r from-gold/15 via-gold/8 to-transparent p-6'
                      : 'border-border bg-surface-1 hover:border-muted-foreground p-5'
                  }`}
                >
                  {formData.role === 'editor' && (
                    <div className="absolute top-0 right-0 bg-gold text-background text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5">
                      Most Popular
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <div className={`p-3 ${formData.role === 'editor' ? 'bg-gold/20 border border-gold/30' : 'bg-surface-2'}`}>
                      <Swords className={`h-6 w-6 ${formData.role === 'editor' ? 'text-gold' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-display ${formData.role === 'editor' ? 'text-2xl' : 'text-xl'}`}>EDITOR</h3>
                        {formData.role === 'editor' && (
                          <div className="h-5 w-5 rounded-full bg-gold flex items-center justify-center">
                            <Check className="h-3 w-3 text-background" />
                          </div>
                        )}
                      </div>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        Compete in arenas, build your rank, prove your skill
                      </p>
                    </div>
                  </div>
                </button>

                {/* Judge — secondary, understated */}
                <button
                  onClick={() => setFormData(prev => ({ ...prev, role: 'judge' }))}
                  className={`w-full p-4 border transition-all duration-200 text-left group ${
                    formData.role === 'judge'
                      ? 'border-gold bg-gold/10'
                      : 'border-border/60 bg-surface-1/60 hover:border-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 ${formData.role === 'judge' ? 'bg-gold/20' : 'bg-surface-2/60'}`}>
                      <Scale className={`h-4 w-4 ${formData.role === 'judge' ? 'text-gold' : 'text-muted-foreground/60'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display text-base text-muted-foreground">JUDGE</h3>
                        {formData.role === 'judge' && (
                          <div className="h-5 w-5 rounded-full bg-gold flex items-center justify-center">
                            <Check className="h-3 w-3 text-background" />
                          </div>
                        )}
                      </div>
                      <p className="text-muted-foreground/60 text-[11px] mt-0.5">
                        Score submissions, shape the meta, earn authority
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 1: Username */}
          {step === 1 && (
            <motion.div
              key="username"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-md mx-auto"
            >
              <div className="text-center mb-8">
                <h1 className="font-display text-4xl sm:text-5xl tracking-tight mb-2">
                  CLAIM YOUR NAME
                </h1>
                <p className="text-muted-foreground text-sm">
                  This is how you'll be known in the arena
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      value={formData.username}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, username: e.target.value }));
                        setErrors(prev => ({ ...prev, username: '' }));
                      }}
                      placeholder="your_name"
                      className="pl-12 h-14 bg-surface-1 border-border text-lg"
                      maxLength={20}
                      autoFocus
                    />
                  </div>
                  {errors.username && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-destructive pl-1"
                    >
                      {errors.username}
                    </motion.p>
                  )}
                  <p className="text-xs text-muted-foreground/60 pl-1">
                    3-20 characters • letters, numbers, underscores
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Password + Optional Email + Invite Code toggle */}
          {step === 2 && (
            <motion.div
              key="account"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-md mx-auto"
            >
              <div className="text-center mb-8">
                <h1 className="font-display text-4xl sm:text-5xl tracking-tight mb-2">
                  LOCK IT IN
                </h1>
                <p className="text-muted-foreground text-sm">
                  Secure your spot as <span className="text-gold font-semibold">{formData.username}</span>
                </p>
              </div>

              <div className="space-y-4">
                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest pl-1">
                    Password <span className="text-gold">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, password: e.target.value }));
                        setErrors(prev => ({ ...prev, password: '' }));
                      }}
                      placeholder="6+ characters"
                      className="pl-12 pr-12 h-14 bg-surface-1 border-border text-lg"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-destructive pl-1"
                    >
                      {errors.password}
                    </motion.p>
                  )}
                </div>

                {/* Email - Optional */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest pl-1">
                    Email <span className="text-muted-foreground/50">(optional — for recovery)</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, email: e.target.value }));
                        setErrors(prev => ({ ...prev, email: '' }));
                      }}
                      placeholder="sync across devices"
                      className="pl-12 h-14 bg-surface-1 border-border text-lg"
                    />
                  </div>
                  {errors.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-destructive pl-1"
                    >
                      {errors.email}
                    </motion.p>
                  )}
                </div>

                {/* Invite Code - collapsible toggle */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowInviteCode(!showInviteCode)}
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-gold transition-colors group"
                  >
                    <Ticket className="h-3.5 w-3.5" />
                    <span>Got an invite code? <span className="text-gold/70 group-hover:text-gold">Redeem free XP</span></span>
                    <ChevronDown className={`h-3 w-3 transition-transform ${showInviteCode ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {showInviteCode && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2 space-y-1.5">
                          <div className="relative">
                            <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              value={formData.inviteCode}
                              onChange={(e) => {
                                const code = e.target.value.toUpperCase();
                                setFormData(prev => ({ ...prev, inviteCode: code }));
                                validateInviteCode(code);
                              }}
                              placeholder="ENTER CODE"
                              className="pl-11 h-11 bg-surface-1 border-border uppercase tracking-widest text-sm"
                              maxLength={20}
                            />
                          </div>
                          {codeInfo && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center gap-2 text-xs text-gold pl-1"
                            >
                              {codeInfo.type === 'personal' ? (
                                <>
                                  <Zap className="h-3 w-3" />
                                  <span>Invited by {codeInfo.inviterName} — bonus XP!</span>
                                </>
                              ) : (
                                <>
                                  <Users className="h-3 w-3" />
                                  <span>Joining {codeInfo.crewName} — bonus XP!</span>
                                </>
                              )}
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom actions - inside flex container, always visible */}
        <div className="mt-8 max-w-md mx-auto w-full space-y-3">
          <div className="flex gap-3">
            {step > 0 && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={loading}
                className="h-14 px-5 border-border"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            
            <Button
              onClick={handleNext}
              disabled={loading || !canProceed()}
              className="flex-1 h-14 bg-gold hover:bg-gold/90 text-gold-foreground font-display text-lg"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-gold-foreground/30 border-t-gold-foreground rounded-full animate-spin" />
              ) : step === 2 ? (
                <>
                  <GateIcon className="mr-2 h-5 w-5" />
                  CREATE ACCOUNT
                </>
              ) : (
                <>
                  CONTINUE
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>

          {/* Login link */}
          <div className="text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Already have an account? <span className="text-gold">Sign in</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
