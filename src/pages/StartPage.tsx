import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, User, MapPin, Ticket, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTempProfile } from '@/hooks/useTempProfile';
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

export default function StartPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setProfile } = useTempProfile();
  const [username, setUsername] = useState('');
  const [region, setRegion] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [codeInfo, setCodeInfo] = useState<{ type: 'personal' | 'crew'; crewName?: string; inviterName?: string } | null>(null);
  
  // Check for invite code in URL params
  useEffect(() => {
    const codeFromUrl = searchParams.get('code') || searchParams.get('invite');
    if (codeFromUrl) {
      setInviteCode(codeFromUrl.toUpperCase());
      validateInviteCode(codeFromUrl.toUpperCase());
    }
  }, [searchParams]);

  const validateInviteCode = async (code: string) => {
    if (!code || code.length < 4) {
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
      // Get inviter username
      const { data: inviter } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', invite.inviter_id)
        .single();
      
      setCodeInfo({ type: 'personal', inviterName: inviter?.username });
      return;
    }

    // Check if it's a crew invite (crew name as code)
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
      setUsernameError('Username must be at least 3 characters');
      return false;
    }
    if (name.length > 20) {
      setUsernameError('Username must be 20 characters or less');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
      setUsernameError('Only letters, numbers, and underscores');
      return false;
    }

    // Check if username is taken
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email')
      .ilike('username', name)
      .maybeSingle();

    if (error) {
      console.error('Error checking username:', error);
      return true; // Allow to proceed on error
    }

    if (data) {
      // Check if this user has an email (verified account)
      if (data.email) {
        setUsernameError('Account exists — use email to log in');
        return false;
      }
      // Username taken but no email (shouldn't happen, but handle it)
      setUsernameError('Username is taken');
      return false;
    }

    setUsernameError('');
    return true;
  };

  const handleContinue = async () => {
    if (!username.trim()) {
      setUsernameError('Username is required');
      return;
    }

    setLoading(true);
    const isValid = await validateUsername(username.trim());
    
    if (!isValid) {
      setLoading(false);
      return;
    }

    // Get pending crew ID if it's a crew code
    let pendingCrewId: string | undefined;
    if (codeInfo?.type === 'crew' && inviteCode) {
      const { data: crew } = await supabase
        .from('crews')
        .select('id')
        .ilike('name', inviteCode.replace(/-/g, ' '))
        .maybeSingle();
      pendingCrewId = crew?.id;
    }

    // Create temp profile with invite code
    setProfile({
      username: username.trim(),
      region: region || undefined,
      createdAt: new Date().toISOString(),
      inviteCode: inviteCode.trim() || undefined,
      pendingCrewId,
    });

    // Show welcome message
    if (codeInfo?.inviterName) {
      toast.success(`Welcome, ${username}!`, { 
        description: `Invited by ${codeInfo.inviterName}` 
      });
    } else if (codeInfo?.crewName) {
      toast.success(`Welcome, ${username}!`, { 
        description: `Joining ${codeInfo.crewName}` 
      });
    } else {
      toast.success(`Welcome, ${username}!`);
    }
    
    navigate('/hub');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-6">
        <img src={loopgateLogo} alt="Loopgate" className="h-6 opacity-80" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-20">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-center mb-10">
            <h1 className="font-display text-4xl sm:text-5xl mb-3">
              Create Your Profile
            </h1>
            <p className="text-muted-foreground">
              Start in seconds. Secure your account anytime.
            </p>
          </div>

          <div className="space-y-6">
            {/* Username */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setUsernameError('');
                  }}
                  placeholder="your_name"
                  className="pl-12 h-14 bg-surface-1 border-border text-lg"
                  maxLength={20}
                />
              </div>
              {usernameError && (
                <p className="text-sm text-destructive">{usernameError}</p>
              )}
            </div>

            {/* Region (optional) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                Region
                <span className="text-xs text-muted-foreground/60 normal-case">(optional)</span>
              </label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger className="h-14 bg-surface-1 border-border text-lg">
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

            {/* Invite Code (optional) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                Invite Code
                <span className="text-xs text-muted-foreground/60 normal-case">(optional)</span>
              </label>
              <div className="relative">
                <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  value={inviteCode}
                  onChange={(e) => {
                    const code = e.target.value.toUpperCase();
                    setInviteCode(code);
                    validateInviteCode(code);
                  }}
                  placeholder="Friend or crew code"
                  className="pl-12 h-14 bg-surface-1 border-border text-lg uppercase"
                  maxLength={20}
                />
              </div>
              {codeInfo && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-sm text-gold"
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

            {/* Continue button */}
            <Button
              onClick={handleContinue}
              disabled={loading || !username.trim()}
              className="w-full h-14 bg-gold hover:bg-gold/90 text-gold-foreground font-display text-xl"
            >
              {loading ? 'Checking...' : 'Continue'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            {/* Already have account */}
            <div className="text-center pt-4">
              <button
                onClick={() => navigate('/login')}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Already have an account? <span className="text-gold">Sign in</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
