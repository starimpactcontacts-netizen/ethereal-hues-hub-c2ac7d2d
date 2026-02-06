// Simplified Judge Application Flow v2 - No video test required
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Gavel, CheckCircle, 
  Clock, AlertCircle, Send, ChevronRight,
  Star, Sparkles, Shield, Link2, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useAccountPrompt } from '@/hooks/useAccountPrompt';
import { useTempProfile } from '@/hooks/useTempProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import BottomNav from '@/components/loopgate/BottomNav';

const SPECIALTIES = [
  'Anime / AMV',
  'Film / Cinematic',
  'Music Video',
  'Sports',
  'Gaming',
  'Abstract / FX',
  'Meme / Shortform',
  'All-Rounder',
];

const EXPERIENCE_OPTIONS = [
  { value: '<1', label: 'Less than 1 year editing' },
  { value: '1-2', label: '1-2 years editing' },
  { value: '3-5', label: '3-5 years editing' },
  { value: '5+', label: '5+ years editing' },
];

const JUDGING_EXPERIENCE_OPTIONS = [
  { value: 'none', label: 'No prior judging experience' },
  { value: 'discord', label: 'Judged Discord edit competitions' },
  { value: 'community', label: 'Judged community events / collabs' },
  { value: 'professional', label: 'Professional judging experience' },
];

type Step = 'intro' | 'form' | 'submitted';

export default function JudgeApplicationPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { open: openAccountPrompt } = useAccountPrompt();
  const { profile: tempProfile } = useTempProfile();
  const isTemp = !user && !!tempProfile;
  
  const [step, setStep] = useState<Step>('intro');
  const [loading, setLoading] = useState(false);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  
  // Form state
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [bio, setBio] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [experience, setExperience] = useState('');
  const [judgingExperience, setJudgingExperience] = useState('');
  
  // Check for existing application
  useEffect(() => {
    const checkExisting = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('judge_applications')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setExistingApplication(data);
        if (data.status === 'pending') {
          setStep('submitted');
        }
      }
    };
    
    checkExisting();
  }, [user]);
  
  const handleSubmit = async () => {
    if (isTemp) {
      openAccountPrompt('apply_judge');
      return;
    }
    
    if (!user) {
      toast.error('You must be logged in');
      return;
    }
    
    if (!bio.trim()) {
      toast.error('Please tell us why you want to be a judge');
      return;
    }
    
    if (!specialty) {
      toast.error('Please select your specialty');
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('judge_applications')
        .insert({
          user_id: user.id,
          portfolio_url: portfolioUrl.trim() || null,
          bio: bio.trim(),
          specialty: specialty,
          experience_years: experience || null,
          judging_experience: judgingExperience || null,
        });
      
      if (error) throw error;
      
      toast.success('Application submitted!');
      setStep('submitted');
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast.error(error.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };
  
  const renderStep = () => {
    switch (step) {
      case 'intro':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4">
                <Gavel className="w-10 h-10 text-gold" />
              </div>
              <h1 className="font-display text-3xl mb-2">TRIAL JUDGE</h1>
              <p className="text-muted-foreground">
                You're currently a Trial Judge with limited access
              </p>
            </div>
            
            <div className="bg-surface-1 rounded-xl p-4 mb-6 border border-border">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-gold" />
                Trial Judge Access
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Practice reviews (no XP awarded)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Judge crew & friendly matches
                </li>
                <li className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-muted-foreground" />
                  <span className="line-through">Official Arena judging</span>
                </li>
                <li className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-muted-foreground" />
                  <span className="line-through">QOI reviews with XP</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-gold/10 border border-gold/30 rounded-xl p-4 mb-8">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-gold mt-0.5" />
                <div>
                  <h4 className="font-medium text-gold mb-1">Apply for Full Access</h4>
                  <p className="text-sm text-muted-foreground">
                    Complete the application to unlock official Arena judging and earn XP from reviews.
                  </p>
                </div>
              </div>
            </div>
            
            <Button
              onClick={() => setStep('form')}
              className="w-full h-14 bg-gold hover:bg-gold/90 text-black font-medium text-lg"
            >
              Start Application
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        );
        
      case 'form':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="px-4"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Judge Application</p>
                <h2 className="font-display text-xl">Tell Us About You</h2>
              </div>
            </div>
            
            <div className="space-y-5 mb-8">
              {/* Portfolio URL */}
              <div>
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest block mb-2">
                  <Link2 className="w-3.5 h-3.5 inline mr-1.5" />
                  Portfolio / Socials (optional)
                </label>
                <Input
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://linktr.ee/you or TikTok/IG profile"
                  className="h-12 bg-surface-1 border-border"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Your editing work, socials, or linktree
                </p>
              </div>
              
              {/* Specialty */}
              <div>
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest block mb-2">
                  Specialty *
                </label>
                <Select value={specialty} onValueChange={setSpecialty}>
                  <SelectTrigger className="h-12 bg-surface-1 border-border">
                    <SelectValue placeholder="What do you know best?" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIALTIES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Editing Experience */}
              <div>
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest block mb-2">
                  Editing Experience
                </label>
                <Select value={experience} onValueChange={setExperience}>
                  <SelectTrigger className="h-12 bg-surface-1 border-border">
                    <SelectValue placeholder="How long have you been editing?" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Judging Experience */}
              <div>
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest block mb-2">
                  Judging Experience
                </label>
                <Select value={judgingExperience} onValueChange={setJudgingExperience}>
                  <SelectTrigger className="h-12 bg-surface-1 border-border">
                    <SelectValue placeholder="Any prior judging experience?" />
                  </SelectTrigger>
                  <SelectContent>
                    {JUDGING_EXPERIENCE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Bio / Why Judge */}
              <div>
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest block mb-2">
                  Why do you want to judge? *
                </label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="I want to help editors grow by giving honest, constructive feedback..."
                  className="min-h-[100px] bg-surface-1 border-border resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1.5 text-right">
                  {bio.length}/500
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep('intro')}
                className="flex-1 h-12"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !bio.trim() || !specialty}
                className="flex-1 h-12 bg-gold hover:bg-gold/90 text-black font-medium"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        );
        
      case 'submitted':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-4 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            
            <h2 className="font-display text-2xl mb-2">APPLICATION SUBMITTED</h2>
            <p className="text-muted-foreground mb-6">
              We'll review your application and get back to you soon. You'll receive a notification when approved.
            </p>
            
            <div className="bg-surface-1 border border-border rounded-xl p-4 mb-8 text-left">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Clock className="w-4 h-4" />
                <span>While you wait...</span>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Practice judging in the Judge Hub
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Judge unit matches and friendly tournaments
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Explore arenas and events
                </li>
              </ul>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => navigate('/judge-hub')}
                className="h-12 bg-gold hover:bg-gold/90 text-black font-medium"
              >
                Go to Judge Hub
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/hub')}
                className="h-12"
              >
                Back to Hub
              </Button>
            </div>
          </motion.div>
        );
    }
  };
  
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center h-14 px-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-surface-1 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="ml-2 font-medium">Judge Application</span>
        </div>
      </div>
      
      {/* Content */}
      <div className="pt-8 max-w-md mx-auto">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </div>
      
      <BottomNav />
    </div>
  );
}
