import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, User, MapPin, Camera } from 'lucide-react';
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
  const { setProfile } = useTempProfile();
  const [username, setUsername] = useState('');
  const [region, setRegion] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');

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
      .select('id')
      .ilike('username', name)
      .maybeSingle();

    if (error) {
      console.error('Error checking username:', error);
      return true; // Allow to proceed on error
    }

    if (data) {
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

    // Create temp profile
    setProfile({
      username: username.trim(),
      region: region || undefined,
      createdAt: new Date().toISOString(),
    });

    toast.success(`Welcome, ${username}!`);
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
              No email. No password. Just you.
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
