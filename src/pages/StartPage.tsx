import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, User, MapPin, Ticket, Users, Mail, Lock, Swords, Scale, Check, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import loopgateLogo from '@/assets/loopgate-wordmark.png';

const REGIONS = [
  { value: 'na', label: 'North America' },
  { value: 'eu', label: 'Europe' },
  { value: 'asia', label: 'Asia' },
  { value: 'latam', label: 'Latin America' },
  { value: 'oceania', label: 'Oceania' },
  { value: 'africa', label: 'Africa' },
  { value: 'mena', label: 'Middle East' },
];

type UserRole = 'editor' | 'judge';

interface FormData {
  role: UserRole | null;
  username: string;
  email: string;
  password: string;
  region: string;
  inviteCode: string;
}

const STEPS = [
  { id: 'role', title: 'Choose Your Path' },
  { id: 'username', title: 'Claim Your Name' },
  { id: 'account', title: 'Secure Your Account' },
  { id: 'invite', title: 'Got an Invite?' },
];

export default function StartPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [codeInfo, setCodeInfo] = useState<{ type: 'personal' | 'crew'; crewName?: string; inviterName?: string } | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    role: null,
    username: '',
    email: '',
    password: '',
    region: '',
    inviteCode: '',
  });

  // Check for invite code in URL params
  useEffect(() => {
    const codeFromUrl = searchParams.get('code') || searchParams.get('invite');
    if (codeFromUrl) {
      setFormData(prev => ({ ...prev, inviteCode: codeFromUrl.toUpperCase() }));
      validateInviteCode(codeFromUrl.toUpperCase());
    }
  }, [searchParams]);

  const validateInviteCode = async (code: string) => {
    if (!code || code.length < 3) {
      setCodeInfo(null);
      return;
    }

    // Check if it's a personal invite code
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

    // Check if it's a crew invite
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
        // Role selection - just proceed
        if (!formData.role) {
          toast.error('Choose a path to continue');
          setLoading(false);
          return;
        }
        setStep(1);
      } else if (step === 1) {
        // Username validation
        const isValid = await validateUsername(formData.username.trim());
        if (!isValid) {
          setLoading(false);
          return;
        }
        setStep(2);
      } else if (step === 2) {
        // Email/Password validation
        const emailValid = validateEmail(formData.email.trim());
        const passwordValid = validatePassword(formData.password);
        if (!emailValid || !passwordValid) {
          setLoading(false);
          return;
        }
        setStep(3);
      } else if (step === 3) {
        // Final step - create account
        await createAccount();
      }
    } finally {
      setLoading(false);
    }
  };

  const createAccount = async () => {
    setLoading(true);
    
    try {
      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          data: {
            username: formData.username.trim(),
          },
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          setErrors(prev => ({ ...prev, email: 'Email already registered' }));
          setStep(2);
        } else {
          toast.error(authError.message);
        }
        return;
      }

      if (!authData.user) {
        toast.error('Something went wrong');
        return;
      }

      // 2. Update the profile with username and region
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username: formData.username.trim(),
          region: formData.region || null,
          onboarding_completed: true,
          rules_accepted: true,
        })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
      }

      // 3. If judge role, we can add a flag or redirect to judge application
      // For now, all users start as editors

      // 4. Handle invite code redemption
      if (formData.inviteCode && codeInfo) {
        if (codeInfo.type === 'personal') {
          await supabase.rpc('redeem_invite', {
            p_code: formData.inviteCode,
            p_user_id: authData.user.id,
          });
        } else if (codeInfo.type === 'crew') {
          // Auto-join crew
          const { data: crew } = await supabase
            .from('crews')
            .select('id')
            .ilike('name', formData.inviteCode.replace(/-/g, ' '))
            .maybeSingle();
          
          if (crew) {
            await supabase.from('crew_members').insert({
              crew_id: crew.id,
              user_id: authData.user.id,
              role: 'member',
            });
          }
        }
      }

      // Success!
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

      // Navigate based on role
      if (formData.role === 'judge') {
        navigate('/judge-application');
      } else {
        navigate('/hub');
      }
    } catch (err) {
      console.error('Account creation error:', err);
      toast.error('Failed to create account');
    } finally {
      setLoading(false);
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
    if (step === 2) return formData.email.trim().length > 0 && formData.password.length >= 6;
    return true;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Radial gradient background */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-surface-2 via-background to-background pointer-events-none" />
      
      {/* Header */}
      <div className="relative z-10 p-6 flex items-center justify-between">
        <img src={loopgateLogo} alt="Loopgate" className="h-6 opacity-80" />
        
        {/* Step indicator */}
        <div className="flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
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

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-20">
        <AnimatePresence mode="wait">
          {/* Step 0: Role Selection */}
          {step === 0 && (
            <motion.div
              key="role"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md"
            >
              <div className="text-center mb-10">
                <h1 className="font-display text-4xl sm:text-5xl tracking-tight mb-3">
                  CHOOSE YOUR PATH
                </h1>
                <p className="text-muted-foreground">
                  How will you enter the arena?
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => setFormData(prev => ({ ...prev, role: 'editor' }))}
                  className={`w-full p-6 rounded-2xl border-2 transition-all duration-200 text-left group ${
                    formData.role === 'editor'
                      ? 'border-gold bg-gold/10'
                      : 'border-border bg-surface-1 hover:border-muted-foreground'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${formData.role === 'editor' ? 'bg-gold/20' : 'bg-surface-2'}`}>
                      <Swords className={`h-6 w-6 ${formData.role === 'editor' ? 'text-gold' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display text-2xl">EDITOR</h3>
                        {formData.role === 'editor' && (
                          <div className="h-6 w-6 rounded-full bg-gold flex items-center justify-center">
                            <Check className="h-4 w-4 text-background" />
                          </div>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm mt-1">
                        Compete in arenas, build your rank, prove your skill
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setFormData(prev => ({ ...prev, role: 'judge' }))}
                  className={`w-full p-6 rounded-2xl border-2 transition-all duration-200 text-left group ${
                    formData.role === 'judge'
                      ? 'border-gold bg-gold/10'
                      : 'border-border bg-surface-1 hover:border-muted-foreground'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${formData.role === 'judge' ? 'bg-gold/20' : 'bg-surface-2'}`}>
                      <Scale className={`h-6 w-6 ${formData.role === 'judge' ? 'text-gold' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display text-2xl">JUDGE</h3>
                        {formData.role === 'judge' && (
                          <div className="h-6 w-6 rounded-full bg-gold flex items-center justify-center">
                            <Check className="h-4 w-4 text-background" />
                          </div>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm mt-1">
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
              transition={{ duration: 0.3 }}
              className="w-full max-w-md"
            >
              <div className="text-center mb-10">
                <h1 className="font-display text-4xl sm:text-5xl tracking-tight mb-3">
                  CLAIM YOUR NAME
                </h1>
                <p className="text-muted-foreground">
                  This is how you'll be known in the arena
                </p>
              </div>

              <div className="space-y-6">
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
                      className="pl-12 h-14 bg-surface-1 border-border text-lg rounded-xl"
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
                </div>

                {/* Optional Region */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest pl-1">
                    Region <span className="text-muted-foreground/60">(optional)</span>
                  </label>
                  <Select 
                    value={formData.region} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, region: v }))}
                  >
                    <SelectTrigger className="h-14 bg-surface-1 border-border text-lg rounded-xl">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <SelectValue placeholder="Select your region" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Email & Password */}
          {step === 2 && (
            <motion.div
              key="account"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md"
            >
              <div className="text-center mb-10">
                <h1 className="font-display text-4xl sm:text-5xl tracking-tight mb-3">
                  SECURE YOUR ACCOUNT
                </h1>
                <p className="text-muted-foreground">
                  Lock in your progress and identity
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, email: e.target.value }));
                        setErrors(prev => ({ ...prev, email: '' }));
                      }}
                      placeholder="Email address"
                      className="pl-12 h-14 bg-surface-1 border-border text-lg rounded-xl"
                      autoFocus
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

                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, password: e.target.value }));
                        setErrors(prev => ({ ...prev, password: '' }));
                      }}
                      placeholder="Password"
                      className="pl-12 pr-12 h-14 bg-surface-1 border-border text-lg rounded-xl"
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
              </div>
            </motion.div>
          )}

          {/* Step 3: Invite Code */}
          {step === 3 && (
            <motion.div
              key="invite"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md"
            >
              <div className="text-center mb-10">
                <h1 className="font-display text-4xl sm:text-5xl tracking-tight mb-3">
                  GOT AN INVITE?
                </h1>
                <p className="text-muted-foreground">
                  Enter a friend's code or crew code for bonus XP
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="relative">
                    <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      value={formData.inviteCode}
                      onChange={(e) => {
                        const code = e.target.value.toUpperCase();
                        setFormData(prev => ({ ...prev, inviteCode: code }));
                        validateInviteCode(code);
                      }}
                      placeholder="INVITE CODE"
                      className="pl-12 h-14 bg-surface-1 border-border text-lg uppercase rounded-xl tracking-widest"
                      maxLength={20}
                      autoFocus
                    />
                  </div>
                  {codeInfo && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-sm text-gold pl-1"
                    >
                      {codeInfo.type === 'personal' ? (
                        <>
                          <User className="h-4 w-4" />
                          <span>Invited by {codeInfo.inviterName}</span>
                        </>
                      ) : (
                        <>
                          <Users className="h-4 w-4" />
                          <span>Joining {codeInfo.crewName}</span>
                        </>
                      )}
                    </motion.div>
                  )}
                </div>

                <p className="text-center text-sm text-muted-foreground">
                  No code? No problem — skip and join later
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom actions */}
      <div className="relative z-10 p-6 pb-safe space-y-4">
        <div className="flex gap-3 max-w-md mx-auto">
          {step > 0 && (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={loading}
              className="h-14 px-6 rounded-xl border-border"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          
          <Button
            onClick={handleNext}
            disabled={loading || !canProceed()}
            className="flex-1 h-14 bg-gold hover:bg-gold/90 text-gold-foreground font-display text-xl rounded-xl"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-gold-foreground/30 border-t-gold-foreground rounded-full animate-spin" />
            ) : step === 3 ? (
              'CREATE ACCOUNT'
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
  );
}
