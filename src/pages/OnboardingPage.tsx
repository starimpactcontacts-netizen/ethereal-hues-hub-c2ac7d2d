import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, Loader2, AlertCircle, Globe } from 'lucide-react';
import { validatePlatformUrl } from '@/lib/urlValidation';

const REGIONS = [
  { value: 'NA', label: 'North America' },
  { value: 'EU', label: 'Europe' },
  { value: 'ASIA', label: 'Asia' },
  { value: 'LATAM', label: 'Latin America' },
  { value: 'MENA', label: 'Middle East & North Africa' },
  { value: 'OCE', label: 'Oceania' },
  { value: 'AF', label: 'Africa' },
];

const STEPS = [
  { id: 1, title: 'Choose Username' },
  { id: 2, title: 'Connect Socials' },
  { id: 3, title: 'Accept Rules' },
];

export default function OnboardingPage() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  // Form state
  const [username, setUsername] = useState('');
  const [region, setRegion] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [tiktokUsername, setTiktokUsername] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [instagramUsername, setInstagramUsername] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeUsername, setYoutubeUsername] = useState('');
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [urlErrors, setUrlErrors] = useState<Record<string, string>>({});

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

  const handleNext = async () => {
    setIsLoading(true);

    try {
      if (currentStep === 1) {
        const isValid = await validateUsername();
        if (!isValid) {
          setIsLoading(false);
          return;
        }
        if (!region) {
          toast.error('Please select your region');
          setIsLoading(false);
          return;
        }
      }

      if (currentStep === 2) {
        // All socials are completely optional - NO VALIDATION BLOCKING
        // Clear any old errors and proceed
        setUrlErrors({});
      }

      // Step 3 is now Accept Rules (final step)

      if (currentStep === 3) {
        if (!rulesAccepted) {
          toast.error('You must accept the competition rules');
          setIsLoading(false);
          return;
        }

        // Update profile with chosen username and details
        const { error: profileError } = await supabase.from('profiles')
          .update({
            username: username.toUpperCase(),
            display_name: username,
            region: region,
            rules_accepted: true,
            onboarding_completed: true,
          })
          .eq('id', user!.id);

        if (profileError) {
          toast.error('Failed to update profile');
          setIsLoading(false);
          return;
        }

        // Add TikTok (optional now)
        if (tiktokUrl && tiktokUsername) {
          await supabase.from('connected_platforms').insert({
            user_id: user!.id,
            platform: 'tiktok',
            platform_username: tiktokUsername,
            platform_url: tiktokUrl,
          });
        }

        // Add Instagram (optional)
        if (instagramUrl && instagramUsername) {
          await supabase.from('connected_platforms').insert({
            user_id: user!.id,
            platform: 'instagram',
            platform_username: instagramUsername,
            platform_url: instagramUrl,
          });
        }

        // Add YouTube (optional)
        if (youtubeUrl && youtubeUsername) {
          await supabase.from('connected_platforms').insert({
            user_id: user!.id,
            platform: 'youtube',
            platform_username: youtubeUsername,
            platform_url: youtubeUrl,
          });
        }

        await refreshProfile();
        toast.success('Profile created successfully!');
        navigate('/hub');
        return;
      }

      setCurrentStep(currentStep + 1);
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl mb-2">Create Your Profile</h1>
          <p className="text-muted-foreground">Step {currentStep} of 3</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-10">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`h-1 flex-1 transition-colors ${
                step.id <= currentStep ? 'bg-gold' : 'bg-border'
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-surface-1 border border-border p-8">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="font-display text-2xl mb-2">Choose Your Username</h2>
                <p className="text-muted-foreground text-sm mb-6">
                  This will be your permanent identity on Loopgate. Choose wisely.
                </p>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value.toUpperCase());
                        setUsernameError('');
                      }}
                      placeholder="ENTER USERNAME"
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

                  <div className="pt-4">
                    <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Your Region
                    </label>
                    <Select value={region} onValueChange={setRegion}>
                      <SelectTrigger className="h-12 bg-surface-0 border-border">
                        <SelectValue placeholder="Select your region" />
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

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="font-display text-2xl mb-2">Connect Socials</h2>
                <p className="text-muted-foreground text-sm mb-6">
                  Optional. Add your social profiles to compete in events.
                </p>
                
                <div className="space-y-6">
                  {/* TikTok */}
                  <div className="space-y-3">
                    <h3 className="font-display text-lg flex items-center gap-2">
                      TikTok
                      <span className="text-xs text-muted-foreground font-sans normal-case">(Optional)</span>
                    </h3>
                    <Input
                      value={tiktokUsername}
                      onChange={(e) => setTiktokUsername(e.target.value)}
                      placeholder="@yourusername"
                      className="h-12 bg-surface-0 border-border"
                    />
                    <Input
                      value={tiktokUrl}
                      onChange={(e) => {
                        setTiktokUrl(e.target.value);
                        setUrlErrors(prev => ({ ...prev, tiktok: '' }));
                      }}
                      placeholder="https://tiktok.com/@yourusername"
                      className={`h-12 bg-surface-0 ${urlErrors.tiktok ? 'border-destructive' : 'border-border'}`}
                    />
                    {urlErrors.tiktok && (
                      <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {urlErrors.tiktok}
                      </p>
                    )}
                  </div>

                  {/* Instagram */}
                  <div className="space-y-3">
                    <h3 className="font-display text-lg flex items-center gap-2">
                      Instagram
                      <span className="text-xs text-muted-foreground font-sans normal-case">(Optional)</span>
                    </h3>
                    <Input
                      value={instagramUsername}
                      onChange={(e) => setInstagramUsername(e.target.value)}
                      placeholder="@yourusername"
                      className="h-12 bg-surface-0 border-border"
                    />
                    <Input
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                      placeholder="https://instagram.com/yourusername"
                      className="h-12 bg-surface-0 border-border"
                    />
                  </div>

                  {/* YouTube */}
                  <div className="space-y-3">
                    <h3 className="font-display text-lg flex items-center gap-2">
                      YouTube
                      <span className="text-xs text-muted-foreground font-sans normal-case">(Optional)</span>
                    </h3>
                    <Input
                      value={youtubeUsername}
                      onChange={(e) => setYoutubeUsername(e.target.value)}
                      placeholder="Channel name"
                      className="h-12 bg-surface-0 border-border"
                    />
                    <Input
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="https://youtube.com/@yourchannel"
                      className="h-12 bg-surface-0 border-border"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="font-display text-2xl mb-2">Competition Rules</h2>
                <p className="text-muted-foreground text-sm mb-6">
                  Review and accept the Loopgate competition rules.
                </p>
                
                <div className="bg-surface-0 border border-border p-4 mb-6 max-h-48 overflow-y-auto text-sm text-muted-foreground space-y-3">
                  <p><strong className="text-foreground">1. Eligibility:</strong> All participants must be 16 years or older.</p>
                  <p><strong className="text-foreground">2. Submissions:</strong> All edits must be original work. Plagiarism results in permanent ban.</p>
                  <p><strong className="text-foreground">3. Judging:</strong> QOI scores are final. No appeals after event closure.</p>
                  <p><strong className="text-foreground">4. Conduct:</strong> Harassment of judges or competitors results in disqualification.</p>
                  <p><strong className="text-foreground">5. Prizes:</strong> Prize payouts processed within 30 days of event closure.</p>
                  <p><strong className="text-foreground">6. Integrity:</strong> Use of AI-generated content must be disclosed.</p>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="rules"
                    checked={rulesAccepted}
                    onCheckedChange={(checked) => setRulesAccepted(checked === true)}
                    className="mt-1 border-gold data-[state=checked]:bg-gold data-[state=checked]:text-gold-foreground"
                  />
                  <label htmlFor="rules" className="text-sm cursor-pointer">
                    I have read and accept the Loopgate Competition Rules. I understand that my username cannot be changed.
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            onClick={handleNext}
            disabled={isLoading}
            className="w-full mt-8 bg-gold hover:bg-gold/90 text-gold-foreground font-display text-lg h-12"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : currentStep === 3 ? (
              <>
                Create Profile
                <Check className="ml-2 w-5 h-5" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
