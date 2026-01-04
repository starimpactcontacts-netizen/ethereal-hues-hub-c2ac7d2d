import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Check, Loader2, AlertCircle, Building2 } from 'lucide-react';

export default function EnterpriseOnboardingPage() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [username, setUsername] = useState('');

  const validateUsername = async () => {
    if (!username || username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return false;
    }
    if (username.length > 20) {
      setUsernameError('Username must be less than 20 characters');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError('Only letters, numbers, and underscores allowed');
      return false;
    }

    const { data } = await supabase.rpc('is_username_available', { 
      check_username: username.toUpperCase() 
    });
    
    if (!data) {
      setUsernameError('Username is already taken');
      return false;
    }

    setUsernameError('');
    return true;
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const isValid = await validateUsername();
      if (!isValid) {
        setIsLoading(false);
        return;
      }

      // Create enterprise profile - no TikTok required
      const { error: profileError } = await supabase.from('profiles').insert({
        id: user!.id,
        username: username.toUpperCase(),
        rules_accepted: true,
        onboarding_completed: true,
      });

      if (profileError) {
        toast.error('Failed to create profile');
        setIsLoading(false);
        return;
      }

      await refreshProfile();
      toast.success('Enterprise profile created!');
      navigate('/hub');
    } catch {
      toast.error('Something went wrong');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-gold/5 rounded-full blur-[100px]" />
      
      <motion.div 
        className="relative z-10 w-full max-w-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Enterprise Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-full">
            <Building2 className="w-4 h-4 text-gold" />
            <span className="text-gold font-display text-sm">ENTERPRISE ACCOUNT</span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl mb-2">Welcome to Loopgate</h1>
          <p className="text-muted-foreground">Set up your enterprise profile</p>
        </div>

        {/* Form */}
        <div className="bg-surface-1 border border-border p-8">
          <h2 className="font-display text-2xl mb-2">Choose Your Username</h2>
          <p className="text-muted-foreground text-sm mb-6">
            This will be your company's identity on Loopgate.
          </p>
          
          <div className="space-y-2">
            <Input
              value={username}
              onChange={(e) => {
                setUsername(e.target.value.toUpperCase());
                setUsernameError('');
              }}
              placeholder="COMPANY NAME"
              className="h-14 bg-surface-0 border-border font-display text-2xl text-center tracking-widest uppercase"
              maxLength={20}
            />
            {usernameError && (
              <p className="text-destructive text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {usernameError}
              </p>
            )}
            <p className="text-xs text-muted-foreground text-center">
              3-20 characters. Letters, numbers, underscores only.
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full mt-8 bg-gold hover:bg-gold/90 text-gold-foreground font-display text-lg h-12"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Create Enterprise Profile
                <Check className="ml-2 w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
