import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useGuestMode } from '@/hooks/useGuestMode';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Target, Send, Trophy, Clock, AlertCircle, ExternalLink, LogIn, Zap, RefreshCw, Play, ChevronRight, ChevronLeft } from 'lucide-react';
import { validatePlatformUrl, detectPlatform, type PlatformType } from '@/lib/urlValidation';
import { toast } from 'sonner';
import GQTResultCard from '@/components/loopgate/GQTResultCard';
import { 
  editorTypes, 
  yearsEditingOptions, 
  softwareOptions, 
  editingSpeedOptions, 
  testPurposeOptions, 
  editingGoalOptions,
  confidenceLabels,
  getRankFromScore
} from '@/data/gqtConfig';

interface GQTSubmission {
  id: string;
  submission_url: string;
  platform: string;
  status: string;
  qoi_score: number | null;
  quality_score: number | null;
  originality_score: number | null;
  impact_score: number | null;
  rhythm_score?: number | null;
  creativity_score?: number | null;
  technical_score?: number | null;
  emotional_score?: number | null;
  style_score?: number | null;
  gqt_rank?: string | null;
  judge_commentary: string | null;
  judge_archetype: string | null;
  created_at: string;
  judged_at: string | null;
  editing_software: string | null;
  years_editing: string | null;
  editing_style: string | null;
  editor_type?: string | null;
  editing_speed?: string | null;
  test_purpose?: string | null;
  confidence_level?: number | null;
  editing_goal?: string | null;
  age_range: string | null;
  rank_projection: string | null;
  suggested_action: string | null;
  house_fit: { houseId: string; houseName: string; fitLevel: string }[] | null;
}

export default function GQTPage() {
  const { user, profile } = useAuth();
  const { isGuest } = useGuestMode();
  const navigate = useNavigate();
  
  // Form state
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState<PlatformType>('tiktok');
  const [urlError, setUrlError] = useState<string | null>(null);
  
  // Interrogation state
  const [editorType, setEditorType] = useState('');
  const [yearsEditing, setYearsEditing] = useState('');
  const [editingSoftware, setEditingSoftware] = useState('');
  const [editingSpeed, setEditingSpeed] = useState('');
  const [testPurpose, setTestPurpose] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState(5);
  const [editingGoal, setEditingGoal] = useState('');
  
  // "Other" notes state
  const [editorTypeNote, setEditorTypeNote] = useState('');
  const [yearsEditingNote, setYearsEditingNote] = useState('');
  const [editingSoftwareNote, setEditingSoftwareNote] = useState('');
  const [editingSpeedNote, setEditingSpeedNote] = useState('');
  const [testPurposeNote, setTestPurposeNote] = useState('');
  const [editingGoalNote, setEditingGoalNote] = useState('');
  
  // UI state
  const [step, setStep] = useState<'form' | 'interrogation'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latestSubmission, setLatestSubmission] = useState<GQTSubmission | null>(null);
  const [pendingSubmission, setPendingSubmission] = useState<GQTSubmission | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  
  const isAuthenticated = !!user && !isGuest;
  
  useEffect(() => {
    if (profile?.id) {
      loadLatestSubmission();
    }
  }, [profile?.id]);
  
  const loadLatestSubmission = async () => {
    if (!profile?.id) return;
    
    const { data } = await supabase
      .from('gatekeeper_submissions')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (data) {
      const submission = {
        ...data,
        house_fit: data.house_fit as { houseId: string; houseName: string; fitLevel: string }[] | null
      } as GQTSubmission;
      
      if (data.status === 'pending') {
        setPendingSubmission(submission);
      } else if (data.status === 'scored') {
        setLatestSubmission(submission);
      }
    }
  };
  
  const handleUrlChange = (value: string) => {
    setUrl(value);
    setUrlError(null);
    const detected = detectPlatform(value);
    if (detected) setPlatform(detected);
  };
  
  const validateUrl = (): boolean => {
    const detected = detectPlatform(url);
    if (!detected) {
      setUrlError('Please enter a valid TikTok, Instagram, or YouTube URL');
      return false;
    }
    const validation = validatePlatformUrl(detected, url);
    if (!validation.valid) {
      setUrlError(validation.error || 'Invalid URL');
      return false;
    }
    return true;
  };
  
  const handleProceedToInterrogation = () => {
    if (!validateUrl()) return;
    setStep('interrogation');
  };
  
  const handleSubmit = async () => {
    if (!isAuthenticated || !profile?.id) {
      setShowAuthPrompt(true);
      return;
    }
    
    if (!validateUrl()) return;
    
    const detected = detectPlatform(url);
    if (!detected) {
      toast.error('Could not detect platform from URL');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from('gatekeeper_submissions')
        .insert({
          user_id: profile.id,
          submission_url: url,
          platform: detected,
          editor_type: editorType === 'other' && editorTypeNote ? `other:${editorTypeNote}` : editorType || null,
          years_editing: yearsEditing === 'other' && yearsEditingNote ? `other:${yearsEditingNote}` : yearsEditing || null,
          editing_software: editingSoftware === 'other' && editingSoftwareNote ? `other:${editingSoftwareNote}` : editingSoftware || null,
          editing_speed: editingSpeed === 'other' && editingSpeedNote ? `other:${editingSpeedNote}` : editingSpeed || null,
          test_purpose: testPurpose === 'other' && testPurposeNote ? `other:${testPurposeNote}` : testPurpose || null,
          confidence_level: confidenceLevel,
          editing_goal: editingGoal === 'other' && editingGoalNote ? `other:${editingGoalNote}` : editingGoal || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      const submission = {
        ...data,
        house_fit: data.house_fit as { houseId: string; houseName: string; fitLevel: string }[] | null
      } as GQTSubmission;
      
      setPendingSubmission(submission);
      setLatestSubmission(null);
      resetForm();
      toast.success('Submission received! A judge will review it soon.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setUrl('');
    setEditorType('');
    setYearsEditing('');
    setEditingSoftware('');
    setEditingSpeed('');
    setTestPurpose('');
    setConfidenceLevel(5);
    setEditingGoal('');
    // Reset notes
    setEditorTypeNote('');
    setYearsEditingNote('');
    setEditingSoftwareNote('');
    setEditingSpeedNote('');
    setTestPurposeNote('');
    setEditingGoalNote('');
    setStep('form');
  };

  const handleRetake = () => {
    setLatestSubmission(null);
    setPendingSubmission(null);
    resetForm();
  };
  
  const canProceed = editorType && yearsEditing && editingSoftware && editingSpeed && testPurpose && editingGoal;
  
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="relative border-b border-gold/30 bg-gradient-to-r from-background via-surface-0 to-background overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, hsl(43 74% 49%) 20px, hsl(43 74% 49%) 40px)',
            }}
          />
        </div>
        
        <div className="relative px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gold/10 border-2 border-gold flex items-center justify-center">
                <Target className="w-8 h-8 text-gold" />
              </div>
              <div className="absolute inset-0 border-2 border-gold/50 animate-ping opacity-30" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-3xl text-gold">GLOBAL QOI TEST</h1>
                <Zap className="w-5 h-5 text-gold/60" />
              </div>
              <p className="text-sm text-muted-foreground italic mt-1">
                "Submit an edit. Get your rank."
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-6">
        {/* Best Score Banner */}
        {profile?.best_gatekeeper_qoi && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-gold/20 via-gold/10 to-gold/20 border-2 border-gold p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-gold" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Your Best Score</p>
                  <div className="flex items-baseline gap-2">
                    <p className="font-display text-4xl text-gold">{profile.best_gatekeeper_qoi.toFixed(0)}</p>
                    <span className="text-lg text-muted-foreground font-display">/100</span>
                  </div>
                </div>
              </div>
              <div className={`px-3 py-1.5 ${getRankFromScore(profile.best_gatekeeper_qoi).bgClass} border ${getRankFromScore(profile.best_gatekeeper_qoi).borderClass}`}>
                <span className={`font-display text-2xl ${getRankFromScore(profile.best_gatekeeper_qoi).color}`}>
                  {getRankFromScore(profile.best_gatekeeper_qoi).rank}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pending Submission */}
        <AnimatePresence mode="wait">
          {pendingSubmission && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gradient-to-br from-gold/10 via-surface-0 to-surface-1 border-2 border-gold/50 p-6"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gold/10 border border-gold/50 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-gold" />
                  </div>
                  <div className="absolute inset-0 border border-gold/30 animate-ping opacity-30" />
                </div>
                <div>
                  <h2 className="font-display text-2xl text-gold">AWAITING JUDGMENT</h2>
                  <p className="text-sm text-muted-foreground">Your submission is in the queue</p>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                A judge will score your edit soon. Results typically arrive within 24-48 hours.
              </p>
              
              <a 
                href={pendingSubmission.submission_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-gold hover:underline text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                View your submission
              </a>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Latest Result */}
        {latestSubmission && latestSubmission.status === 'scored' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-foreground">YOUR RESULTS</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetake}
                className="border-gold/50 text-gold hover:bg-gold/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retake Test
              </Button>
            </div>
            <GQTResultCard 
              submission={latestSubmission} 
              username={profile?.username}
              displayName={profile?.display_name}
            />
            
            <div className="grid grid-cols-2 gap-3 pt-4">
              <Link to="/arenas">
                <Button className="w-full bg-gold hover:bg-gold/90 text-background font-display">
                  <Play className="w-4 h-4 mr-2" />
                  Join Event
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={handleRetake}
                className="w-full border-border hover:border-gold/50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                New Edit
              </Button>
            </div>
          </motion.div>
        )}
        
        {/* Submit Flow */}
        {!pendingSubmission && !latestSubmission && (
          <AnimatePresence mode="wait">
            {step === 'form' ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-surface-0 border border-border p-5 space-y-5">
                  <h2 className="font-display text-xl text-foreground">SUBMIT YOUR EDIT</h2>
                  
                  <div className="space-y-2">
                    <Label htmlFor="url" className="text-sm font-semibold">Video URL *</Label>
                    <Input
                      id="url"
                      value={url}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      placeholder="https://tiktok.com/@handle/video/..."
                      className={`h-12 ${urlError ? 'border-destructive' : 'border-border focus:border-gold'}`}
                    />
                    {urlError && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {urlError}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Supports TikTok, Instagram Reels, and YouTube Shorts
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm px-3 py-2 bg-surface-1 border border-border">
                    <span className="text-muted-foreground">Platform detected:</span>
                    <span className="text-foreground font-semibold capitalize">{platform}</span>
                  </div>
                  
                  <Button
                    onClick={handleProceedToInterrogation}
                    disabled={!url}
                    className="w-full bg-gold hover:bg-gold/90 text-background font-display text-lg h-14"
                  >
                    <span className="flex items-center gap-2">
                      Continue to Interrogation
                      <ChevronRight className="w-5 h-5" />
                    </span>
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="interrogation"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="bg-surface-0 border border-gold/30 p-5 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-display text-xl text-gold">INTERROGATION</h2>
                      <p className="text-xs text-muted-foreground mt-1">Answer honestly. This helps judges give better feedback.</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStep('form')}
                      className="text-muted-foreground"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Back
                    </Button>
                  </div>
                  
                  {/* Question 1: Editor Type */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">What type of editor are you? *</Label>
                    <Select value={editorType} onValueChange={setEditorType}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select your style..." />
                      </SelectTrigger>
                      <SelectContent>
                        {editorTypes.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {editorType === 'other' && (
                      <Textarea
                        placeholder="Tell us what type of editor you are... (optional)"
                        value={editorTypeNote}
                        onChange={(e) => setEditorTypeNote(e.target.value)}
                        className="mt-2 text-sm resize-none"
                        rows={2}
                      />
                    )}
                  </div>
                  
                  {/* Question 2: Years Editing */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">How long have you been editing? *</Label>
                    <Select value={yearsEditing} onValueChange={setYearsEditing}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select experience..." />
                      </SelectTrigger>
                      <SelectContent>
                        {yearsEditingOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {yearsEditing === 'other' && (
                      <Textarea
                        placeholder="Explain your editing experience... (optional)"
                        value={yearsEditingNote}
                        onChange={(e) => setYearsEditingNote(e.target.value)}
                        className="mt-2 text-sm resize-none"
                        rows={2}
                      />
                    )}
                  </div>
                  
                  {/* Question 3: Software */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">What's your weapon? (Software) *</Label>
                    <Select value={editingSoftware} onValueChange={setEditingSoftware}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select software..." />
                      </SelectTrigger>
                      <SelectContent>
                        {softwareOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {editingSoftware === 'other' && (
                      <Textarea
                        placeholder="What software do you use? (optional)"
                        value={editingSoftwareNote}
                        onChange={(e) => setEditingSoftwareNote(e.target.value)}
                        className="mt-2 text-sm resize-none"
                        rows={2}
                      />
                    )}
                  </div>
                  
                  {/* Question 4: Editing Speed */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">How fast do you edit? *</Label>
                    <Select value={editingSpeed} onValueChange={setEditingSpeed}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select speed..." />
                      </SelectTrigger>
                      <SelectContent>
                        {editingSpeedOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {editingSpeed === 'other' && (
                      <Textarea
                        placeholder="Describe your editing pace... (optional)"
                        value={editingSpeedNote}
                        onChange={(e) => setEditingSpeedNote(e.target.value)}
                        className="mt-2 text-sm resize-none"
                        rows={2}
                      />
                    )}
                  </div>
                  
                  {/* Question 5: Test Purpose */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">What's your intention? *</Label>
                    <Select value={testPurpose} onValueChange={setTestPurpose}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Why are you here..." />
                      </SelectTrigger>
                      <SelectContent>
                        {testPurposeOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {testPurpose === 'other' && (
                      <Textarea
                        placeholder="What's your intention for this test? (optional)"
                        value={testPurposeNote}
                        onChange={(e) => setTestPurposeNote(e.target.value)}
                        className="mt-2 text-sm resize-none"
                        rows={2}
                      />
                    )}
                  </div>
                  
                  {/* Question 6: Confidence Level */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">How confident are you in this edit? *</Label>
                      <span className={`text-sm font-display ${confidenceLevel >= 7 ? 'text-gold' : 'text-muted-foreground'}`}>
                        {confidenceLevel}/10
                      </span>
                    </div>
                    <Slider
                      value={[confidenceLevel]}
                      onValueChange={(v) => setConfidenceLevel(v[0])}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground text-center italic">
                      "{confidenceLabels[confidenceLevel]}"
                    </p>
                  </div>
                  
                  {/* Question 7: Editing Goal */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">What's your editing goal? *</Label>
                    <Select value={editingGoal} onValueChange={setEditingGoal}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select goal..." />
                      </SelectTrigger>
                      <SelectContent>
                        {editingGoalOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {editingGoal === 'other' && (
                      <Textarea
                        placeholder="What's your editing goal? (optional)"
                        value={editingGoalNote}
                        onChange={(e) => setEditingGoalNote(e.target.value)}
                        className="mt-2 text-sm resize-none"
                        rows={2}
                      />
                    )}
                  </div>
                  
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !canProceed}
                    className="w-full bg-gold hover:bg-gold/90 text-background font-display text-lg h-14"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                        Submitting...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="w-5 h-5" />
                        SUBMIT FOR JUDGMENT
                      </span>
                    )}
                  </Button>
                </div>
                
                <div className="text-center space-y-2 text-sm text-muted-foreground px-4">
                  <p>Submissions are reviewed by real judges.</p>
                  <p className="text-gold">Your best score is saved to your profile.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
      
      {/* Auth Prompt Dialog */}
      <Dialog open={showAuthPrompt} onOpenChange={setShowAuthPrompt}>
        <DialogContent className="bg-surface-0 border-2 border-gold/50 max-w-sm">
          <DialogHeader>
            <div className="w-20 h-20 mx-auto mb-4 bg-gold/10 border-2 border-gold flex items-center justify-center">
              <LogIn className="w-10 h-10 text-gold" />
            </div>
            <DialogTitle className="font-display text-3xl text-center text-gold">
              YOU'RE SO CLOSE
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground space-y-2">
              <p>You've answered the interrogation. Your edit is ready.</p>
              <p className="text-gold font-semibold">Create a free account to submit and get your official rank from a real judge.</p>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 pt-4">
            <Button 
              onClick={() => navigate('/auth')}
              className="w-full bg-gold hover:bg-gold/90 text-background font-display h-14 text-lg"
            >
              <LogIn className="w-5 h-5 mr-2" />
              CREATE FREE ACCOUNT
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowAuthPrompt(false)}
              className="w-full border-border text-muted-foreground h-12"
            >
              I'll Come Back Later
            </Button>
          </div>
          
          <p className="text-xs text-center text-muted-foreground pt-2">
            ✓ Your answers are saved — just sign up and hit submit.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
