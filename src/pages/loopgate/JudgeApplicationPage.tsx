import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Gavel, Video, Target, CheckCircle, 
  Clock, AlertCircle, Send, Play, ChevronRight,
  Star, Sparkles, Shield
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

// Test edits with baseline scores (what the actual score should be)
const SKILL_TEST_EDITS = [
  { 
    id: 1, 
    url: 'https://www.tiktok.com/@example/video/1',
    thumbnail: 'https://placehold.co/300x400/1a1a1a/gold?text=Edit+1',
    baseline: 72,
    description: 'Anime edit with complex transitions'
  },
  { 
    id: 2, 
    url: 'https://www.tiktok.com/@example/video/2',
    thumbnail: 'https://placehold.co/300x400/1a1a1a/gold?text=Edit+2',
    baseline: 45,
    description: 'Beginner edit with basic cuts'
  },
  { 
    id: 3, 
    url: 'https://www.tiktok.com/@example/video/3',
    thumbnail: 'https://placehold.co/300x400/1a1a1a/gold?text=Edit+3',
    baseline: 88,
    description: 'Professional music video edit'
  },
];

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
  { value: '<1', label: 'Less than 1 year' },
  { value: '1-2', label: '1-2 years' },
  { value: '3-5', label: '3-5 years' },
  { value: '5+', label: '5+ years' },
];

type Step = 'intro' | 'video' | 'test' | 'info' | 'review' | 'submitted';

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
  const [videoUrl, setVideoUrl] = useState('');
  const [videoPlatform, setVideoPlatform] = useState<'tiktok' | 'instagram' | 'youtube'>('tiktok');
  const [testScores, setTestScores] = useState<number[]>([50, 50, 50]);
  const [currentTestEdit, setCurrentTestEdit] = useState(0);
  const [specialty, setSpecialty] = useState('');
  const [experience, setExperience] = useState('');
  const [motivation, setMotivation] = useState('');
  
  // Check for existing application
  useEffect(() => {
    if (user) {
      checkExistingApplication();
    }
  }, [user]);
  
  async function checkExistingApplication() {
    if (!user) return;
    
    const { data } = await supabase
      .from('judge_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (data) {
      setExistingApplication(data);
      if (data.status === 'pending') {
        setStep('submitted');
      }
    }
  }
  
  const detectPlatform = (url: string) => {
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    return 'tiktok';
  };
  
  const handleVideoUrlChange = (url: string) => {
    setVideoUrl(url);
    setVideoPlatform(detectPlatform(url));
  };
  
  const handleTestScore = (score: number) => {
    const newScores = [...testScores];
    newScores[currentTestEdit] = score;
    setTestScores(newScores);
    
    if (currentTestEdit < SKILL_TEST_EDITS.length - 1) {
      setTimeout(() => setCurrentTestEdit(currentTestEdit + 1), 500);
    }
  };
  
  const calculateTestAccuracy = () => {
    let totalDiff = 0;
    testScores.forEach((score, i) => {
      totalDiff += Math.abs(score - SKILL_TEST_EDITS[i].baseline);
    });
    // Convert to accuracy percentage (0 diff = 100%, 50 diff per edit = 0%)
    const avgDiff = totalDiff / SKILL_TEST_EDITS.length;
    return Math.max(0, 100 - (avgDiff * 2));
  };
  
  const handleSubmit = async () => {
    // If temp profile, prompt for account creation
    if (isTemp) {
      openAccountPrompt('apply_judge');
      return;
    }
    
    if (!user) {
      toast.error('You must be logged in');
      return;
    }
    
    if (!videoUrl.trim()) {
      toast.error('Please provide a rating video URL');
      return;
    }
    
    setLoading(true);
    try {
      const accuracy = calculateTestAccuracy();
      
      const { error } = await supabase
        .from('judge_applications')
        .insert({
          user_id: user.id,
          video_url: videoUrl.trim(),
          video_platform: videoPlatform,
          test_edit_1_score: testScores[0],
          test_edit_1_baseline: SKILL_TEST_EDITS[0].baseline,
          test_edit_2_score: testScores[1],
          test_edit_2_baseline: SKILL_TEST_EDITS[1].baseline,
          test_edit_3_score: testScores[2],
          test_edit_3_baseline: SKILL_TEST_EDITS[2].baseline,
          test_accuracy: accuracy,
          specialty: specialty || null,
          experience_years: experience || null,
          motivation: motivation.trim() || null,
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
            className="text-center px-4"
          >
            {/* Hero */}
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gold/20 blur-[80px] rounded-full" />
              <div className="relative w-24 h-24 mx-auto bg-gradient-to-br from-gold via-amber-500 to-yellow-600 rounded-2xl flex items-center justify-center">
                <Gavel className="w-12 h-12 text-black" />
              </div>
            </div>
            
            <h1 className="font-display text-3xl mb-3">Become a QOI Judge</h1>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
              Join an elite group of editors who rate and review the community's best work.
            </p>
            
            {/* Requirements */}
            <div className="bg-surface-1 border border-border rounded-xl p-6 mb-8 text-left">
              <h3 className="font-display text-sm uppercase tracking-widest text-gold mb-4">
                Requirements
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Video className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Submit a Rating Video</p>
                    <p className="text-xs text-muted-foreground">
                      Post a TikTok/Reel rating an edit to show your commentary style
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Pass the Skill Test</p>
                    <p className="text-xs text-muted-foreground">
                      Score 3 edits — we'll compare your ratings to the baseline
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Manual Review</p>
                    <p className="text-xs text-muted-foreground">
                      Our team reviews every application to ensure quality
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <Button
              onClick={() => setStep('video')}
              className="w-full h-14 bg-gold hover:bg-gold/90 text-black font-display text-lg"
            >
              Start Application
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        );
        
      case 'video':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="px-4"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                <Video className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Step 1 of 3</p>
                <h2 className="font-display text-xl">Rating Video</h2>
              </div>
            </div>
            
            <p className="text-muted-foreground mb-6">
              Post a video (TikTok, Reels, or YouTube Short) where you rate someone's edit. 
              This shows us your commentary style and expertise.
            </p>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest block mb-2">
                  Video URL
                </label>
                <Input
                  value={videoUrl}
                  onChange={(e) => handleVideoUrlChange(e.target.value)}
                  placeholder="https://www.tiktok.com/@you/video/..."
                  className="h-14 bg-surface-1 border-border"
                />
              </div>
              
              {videoUrl && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Detected platform: <span className="text-foreground capitalize">{videoPlatform}</span></span>
                </div>
              )}
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
                onClick={() => setStep('test')}
                disabled={!videoUrl.trim()}
                className="flex-1 h-12 bg-gold hover:bg-gold/90 text-black font-medium"
              >
                Continue
              </Button>
            </div>
          </motion.div>
        );
        
      case 'test':
        const currentEdit = SKILL_TEST_EDITS[currentTestEdit];
        const allScored = currentTestEdit === SKILL_TEST_EDITS.length - 1 && testScores[currentTestEdit] !== 50;
        
        return (
          <motion.div
            key={`test-${currentTestEdit}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="px-4"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Step 2 of 3</p>
                <h2 className="font-display text-xl">Skill Test</h2>
              </div>
            </div>
            
            <p className="text-muted-foreground mb-6">
              Rate each edit from 0-100. Your scores will be compared to our baseline to measure accuracy.
            </p>
            
            {/* Progress dots */}
            <div className="flex justify-center gap-2 mb-6">
              {SKILL_TEST_EDITS.map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    i === currentTestEdit 
                      ? 'bg-gold' 
                      : i < currentTestEdit 
                        ? 'bg-gold/50' 
                        : 'bg-border'
                  }`}
                />
              ))}
            </div>
            
            {/* Current edit */}
            <div className="bg-surface-1 border border-border rounded-xl p-4 mb-6">
              <div className="aspect-[3/4] bg-black rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                <img 
                  src={currentEdit.thumbnail} 
                  alt={`Edit ${currentEdit.id}`}
                  className="w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Edit {currentTestEdit + 1}: {currentEdit.description}
              </p>
            </div>
            
            {/* Score slider */}
            <div className="mb-8">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Your Rating</span>
                <span className="font-display text-gold text-xl">{testScores[currentTestEdit]}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={testScores[currentTestEdit]}
                onChange={(e) => handleTestScore(parseInt(e.target.value))}
                className="w-full h-2 bg-border rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-6
                  [&::-webkit-slider-thumb]:h-6
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-gold
                  [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>
            
            {allScored ? (
              <div className="space-y-4">
                <div className="bg-gold/10 border border-gold/30 rounded-xl p-4 text-center">
                  <Sparkles className="w-6 h-6 text-gold mx-auto mb-2" />
                  <p className="font-medium">Test Complete!</p>
                  <p className="text-sm text-muted-foreground">
                    Accuracy: <span className="text-gold font-bold">{calculateTestAccuracy().toFixed(0)}%</span>
                  </p>
                </div>
                <Button
                  onClick={() => setStep('info')}
                  className="w-full h-12 bg-gold hover:bg-gold/90 text-black font-medium"
                >
                  Continue
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setStep('video')}
                className="w-full h-12"
              >
                Back
              </Button>
            )}
          </motion.div>
        );
        
      case 'info':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="px-4"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                <Star className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Step 3 of 3</p>
                <h2 className="font-display text-xl">About You</h2>
              </div>
            </div>
            
            <p className="text-muted-foreground mb-6">
              Tell us a bit about your editing background. This helps us understand your expertise.
            </p>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest block mb-2">
                  Specialty
                </label>
                <Select value={specialty} onValueChange={setSpecialty}>
                  <SelectTrigger className="h-12 bg-surface-1 border-border">
                    <SelectValue placeholder="Select your niche" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIALTIES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest block mb-2">
                  Experience
                </label>
                <Select value={experience} onValueChange={setExperience}>
                  <SelectTrigger className="h-12 bg-surface-1 border-border">
                    <SelectValue placeholder="Years editing" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest block mb-2">
                  Why do you want to be a judge? <span className="text-muted-foreground/60">(optional)</span>
                </label>
                <Textarea
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  placeholder="I want to help the community improve..."
                  className="bg-surface-1 border-border min-h-[100px]"
                  maxLength={500}
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep('test')}
                className="flex-1 h-12"
              >
                Back
              </Button>
              <Button
                onClick={() => setStep('review')}
                className="flex-1 h-12 bg-gold hover:bg-gold/90 text-black font-medium"
              >
                Review
              </Button>
            </div>
          </motion.div>
        );
        
      case 'review':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="px-4"
          >
            <h2 className="font-display text-2xl text-center mb-6">Review Application</h2>
            
            <div className="space-y-4 mb-8">
              {/* Video */}
              <div className="bg-surface-1 border border-border rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Video className="w-4 h-4 text-gold" />
                  <span className="text-sm font-medium">Rating Video</span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{videoUrl}</p>
              </div>
              
              {/* Test scores */}
              <div className="bg-surface-1 border border-border rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="w-4 h-4 text-gold" />
                  <span className="text-sm font-medium">Skill Test</span>
                  <span className="ml-auto text-gold font-bold">{calculateTestAccuracy().toFixed(0)}% accuracy</span>
                </div>
                <div className="flex gap-2">
                  {testScores.map((score, i) => (
                    <div key={i} className="flex-1 bg-black/30 rounded-lg p-2 text-center">
                      <div className="text-lg font-bold">{score}</div>
                      <div className="text-[10px] text-muted-foreground">Edit {i + 1}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Info */}
              <div className="bg-surface-1 border border-border rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Star className="w-4 h-4 text-gold" />
                  <span className="text-sm font-medium">About You</span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Specialty: {specialty || 'Not specified'}</p>
                  <p>Experience: {EXPERIENCE_OPTIONS.find(o => o.value === experience)?.label || 'Not specified'}</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep('info')}
                className="flex-1 h-12"
              >
                Edit
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 h-12 bg-gold hover:bg-gold/90 text-black font-bold"
              >
                {loading ? 'Submitting...' : 'Submit'}
                <Send className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        );
        
      case 'submitted':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center px-4"
          >
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gold/20 blur-[80px] rounded-full" />
              <div className="relative w-24 h-24 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <Clock className="w-12 h-12 text-white" />
              </div>
            </div>
            
            <h1 className="font-display text-3xl mb-3">Application Submitted</h1>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
              Your application is under review. We'll notify you once a decision is made.
            </p>
            
            <div className="bg-surface-1 border border-border rounded-xl p-6 mb-8">
              <div className="flex items-center justify-center gap-2 text-amber-400 mb-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Pending Review</span>
              </div>
              <p className="text-sm text-muted-foreground">
                This usually takes 1-3 days. Check your notifications for updates.
              </p>
            </div>
            
            <Button
              onClick={() => navigate('/judges')}
              variant="outline"
              className="w-full h-12"
            >
              Back to Judge Hub
            </Button>
          </motion.div>
        );
    }
  };
  
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => step === 'intro' ? navigate(-1) : setStep('intro')}
            className="p-2 hover:bg-surface-1 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="font-display text-sm uppercase tracking-widest">Judge Application</span>
          <div className="w-10" />
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-md mx-auto py-8">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </div>
      
      <BottomNav />
    </div>
  );
}
