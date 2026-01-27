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
import { Target, Send, Trophy, Clock, AlertCircle, ExternalLink, LogIn, Zap, RefreshCw, ChevronRight, ChevronLeft, Crosshair, ArrowRight } from 'lucide-react';
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
  const [cooldownDays, setCooldownDays] = useState<number | null>(null);
  
  const isAuthenticated = !!user && !isGuest;
  const bestScore = profile?.best_gatekeeper_qoi;
  const rank = bestScore ? getRankFromScore(bestScore) : null;
  
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
        setCooldownDays(null);
      } else if (data.status === 'scored') {
        setLatestSubmission(submission);
        
        const lastScoredDate = new Date(data.judged_at || data.created_at);
        const daysSinceScored = Math.floor((Date.now() - lastScoredDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceScored < 7) {
          setCooldownDays(7 - daysSinceScored);
        } else {
          setCooldownDays(null);
        }
      }
    } else {
      setCooldownDays(null);
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
    
    if (cooldownDays !== null && cooldownDays > 0) {
      toast.error(`You must wait ${cooldownDays} more day${cooldownDays === 1 ? '' : 's'} before taking the GQT again`);
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
      {/* Compact Hero Header */}
      <div className="p-4 pt-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-1/80 backdrop-blur-xl border border-border/50 overflow-hidden"
        >
          {/* Main Header Content */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-surface-0 border border-gold/40 flex items-center justify-center">
                <Crosshair className="w-7 h-7 text-gold" />
              </div>
              <div>
                <h1 className="font-display text-2xl text-foreground tracking-wide">
                  GLOBAL QOI TEST
                </h1>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Submit an edit. Get your rank.
                </p>
              </div>
            </div>
            
            {/* Best Score Badge */}
            {bestScore && rank && (
              <div className={`${rank.bgClass} border ${rank.borderClass} px-3 py-2 text-right`}>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Best</p>
                <div className="flex items-baseline gap-1">
                  <span className={`font-display text-2xl ${rank.color}`}>{bestScore.toFixed(0)}</span>
                  <span className="text-[10px] text-muted-foreground">/100</span>
                </div>
                <span className={`font-display text-sm ${rank.color}`}>{rank.rank}</span>
              </div>
            )}
          </div>

          {/* Cooldown Banner */}
          {cooldownDays !== null && cooldownDays > 0 && (
            <div className="px-4 py-2 bg-surface-0 border-t border-border/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Cooldown active</span>
              </div>
              <span className="text-sm font-display text-foreground">
                {cooldownDays} day{cooldownDays === 1 ? '' : 's'} remaining
              </span>
            </div>
          )}
        </motion.div>
      </div>

      <div className="px-4 space-y-4">
        {/* Pending Submission Card */}
        <AnimatePresence mode="wait">
          {pendingSubmission && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Link 
                to={pendingSubmission.submission_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-surface-1/80 backdrop-blur-xl border border-gold/30 p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 bg-gold/10 border border-gold/30 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-gold" />
                    </div>
                    <div className="absolute inset-0 border border-gold/20 animate-ping opacity-40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gold uppercase tracking-[0.15em] font-semibold">Awaiting Judgment</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">
                      Your submission is in the queue
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gold shrink-0" />
                </div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Latest Result Card */}
        {latestSubmission && latestSubmission.status === 'scored' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg text-foreground">Your Results</h2>
              {cooldownDays === null || cooldownDays <= 0 ? (
                <button
                  onClick={handleRetake}
                  className="flex items-center gap-1.5 text-xs text-gold hover:text-gold/80 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retake Test
                </button>
              ) : null}
            </div>
            
            <GQTResultCard 
              submission={latestSubmission} 
              username={profile?.username}
              displayName={profile?.display_name}
            />
            
            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Link to="/arena" className="block">
                <Button className="w-full h-12 bg-gold hover:bg-gold/90 text-background font-display">
                  <Zap className="w-4 h-4 mr-2" />
                  Open Arena
                </Button>
              </Link>
              {cooldownDays !== null && cooldownDays > 0 ? (
                <Button
                  variant="outline"
                  disabled
                  className="h-12 border-border text-muted-foreground"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  {cooldownDays}d Cooldown
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleRetake}
                  className="h-12 border-border hover:border-gold/50 hover:text-gold"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  New Edit
                </Button>
              )}
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
                className="space-y-4"
              >
                {/* Submit Card */}
                <div className="bg-surface-1/80 backdrop-blur-xl border border-border/50 p-5 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-surface-0 border border-border flex items-center justify-center shrink-0">
                      <Target className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <h2 className="font-display text-xl text-foreground">Submit Your Edit</h2>
                      <p className="text-[11px] text-muted-foreground">Get scored by real judges</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="url" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Video URL</Label>
                    <Input
                      id="url"
                      value={url}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      placeholder="https://tiktok.com/@handle/video/..."
                      className={`h-12 bg-surface-0 ${urlError ? 'border-destructive' : 'border-border focus:border-gold/50'}`}
                    />
                    {urlError && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {urlError}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between px-3 py-2 bg-surface-0 border border-border/50">
                    <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Platform</span>
                    <span className="text-sm font-semibold capitalize">{platform}</span>
                  </div>
                  
                  <Button
                    onClick={handleProceedToInterrogation}
                    disabled={!url}
                    className="w-full h-14 bg-gold hover:bg-gold/90 text-background font-display text-base"
                  >
                    <span className="flex items-center gap-2">
                      Continue
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  </Button>
                  
                  <p className="text-[10px] text-center text-muted-foreground">
                    Supports TikTok, Instagram Reels, and YouTube Shorts
                  </p>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-1/60 border border-border/30 p-4">
                    <p className="font-display text-lg text-foreground">24-48h</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Review Time</p>
                  </div>
                  <div className="bg-surface-1/60 border border-border/30 p-4">
                    <p className="font-display text-lg text-foreground">7 Days</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Cooldown</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="interrogation"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {/* Interrogation Header */}
                <div className="bg-surface-1/80 backdrop-blur-xl border border-border/50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gold/10 border border-gold/30 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-gold" />
                      </div>
                      <div>
                        <h2 className="font-display text-xl text-foreground">Interrogation</h2>
                        <p className="text-[11px] text-muted-foreground">Answer honestly for better feedback</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setStep('form')}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </button>
                  </div>
                </div>

                {/* Questions Card */}
                <div className="bg-surface-1/80 backdrop-blur-xl border border-border/50 p-5 space-y-5">
                  {/* Question 1 */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Editor Type</Label>
                    <Select value={editorType} onValueChange={setEditorType}>
                      <SelectTrigger className="h-12 bg-surface-0">
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
                        placeholder="Tell us what type of editor you are..."
                        value={editorTypeNote}
                        onChange={(e) => setEditorTypeNote(e.target.value)}
                        className="mt-2 text-sm resize-none bg-surface-0"
                        rows={2}
                      />
                    )}
                  </div>
                  
                  {/* Question 2 */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Experience</Label>
                    <Select value={yearsEditing} onValueChange={setYearsEditing}>
                      <SelectTrigger className="h-12 bg-surface-0">
                        <SelectValue placeholder="How long have you been editing..." />
                      </SelectTrigger>
                      <SelectContent>
                        {yearsEditingOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {yearsEditing === 'other' && (
                      <Textarea
                        placeholder="Explain your editing experience..."
                        value={yearsEditingNote}
                        onChange={(e) => setYearsEditingNote(e.target.value)}
                        className="mt-2 text-sm resize-none bg-surface-0"
                        rows={2}
                      />
                    )}
                  </div>
                  
                  {/* Question 3 */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Software</Label>
                    <Select value={editingSoftware} onValueChange={setEditingSoftware}>
                      <SelectTrigger className="h-12 bg-surface-0">
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
                        placeholder="What software do you use?"
                        value={editingSoftwareNote}
                        onChange={(e) => setEditingSoftwareNote(e.target.value)}
                        className="mt-2 text-sm resize-none bg-surface-0"
                        rows={2}
                      />
                    )}
                  </div>
                  
                  {/* Question 4 */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Editing Speed</Label>
                    <Select value={editingSpeed} onValueChange={setEditingSpeed}>
                      <SelectTrigger className="h-12 bg-surface-0">
                        <SelectValue placeholder="How fast do you edit..." />
                      </SelectTrigger>
                      <SelectContent>
                        {editingSpeedOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {editingSpeed === 'other' && (
                      <Textarea
                        placeholder="Describe your editing pace..."
                        value={editingSpeedNote}
                        onChange={(e) => setEditingSpeedNote(e.target.value)}
                        className="mt-2 text-sm resize-none bg-surface-0"
                        rows={2}
                      />
                    )}
                  </div>
                  
                  {/* Question 5 */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Intention</Label>
                    <Select value={testPurpose} onValueChange={setTestPurpose}>
                      <SelectTrigger className="h-12 bg-surface-0">
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
                        placeholder="What's your intention?"
                        value={testPurposeNote}
                        onChange={(e) => setTestPurposeNote(e.target.value)}
                        className="mt-2 text-sm resize-none bg-surface-0"
                        rows={2}
                      />
                    )}
                  </div>
                  
                  {/* Question 6 - Confidence Slider */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Confidence Level</Label>
                      <span className={`text-sm font-display ${confidenceLevel >= 7 ? 'text-gold' : 'text-foreground'}`}>
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
                    <p className="text-xs text-center text-muted-foreground italic">
                      "{confidenceLabels[confidenceLevel]}"
                    </p>
                  </div>
                  
                  {/* Question 7 */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Goal</Label>
                    <Select value={editingGoal} onValueChange={setEditingGoal}>
                      <SelectTrigger className="h-12 bg-surface-0">
                        <SelectValue placeholder="What's your editing goal..." />
                      </SelectTrigger>
                      <SelectContent>
                        {editingGoalOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {editingGoal === 'other' && (
                      <Textarea
                        placeholder="What's your editing goal?"
                        value={editingGoalNote}
                        onChange={(e) => setEditingGoalNote(e.target.value)}
                        className="mt-2 text-sm resize-none bg-surface-0"
                        rows={2}
                      />
                    )}
                  </div>
                </div>
                
                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !canProceed}
                  className="w-full h-14 bg-gold hover:bg-gold/90 text-background font-display text-base"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-5 h-5" />
                      Submit for Judgment
                    </span>
                  )}
                </Button>
                
                <p className="text-[10px] text-center text-muted-foreground">
                  Reviewed by real judges • Best score saved to profile
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
      
      {/* Auth Prompt Dialog */}
      <Dialog open={showAuthPrompt} onOpenChange={setShowAuthPrompt}>
        <DialogContent className="bg-surface-0 border border-border max-w-sm">
          <DialogHeader>
            <div className="w-16 h-16 mx-auto mb-4 bg-gold/10 border border-gold/30 flex items-center justify-center">
              <LogIn className="w-8 h-8 text-gold" />
            </div>
            <DialogTitle className="font-display text-2xl text-center text-foreground">
              Almost There
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground space-y-2">
              <p>Create a free account to submit and get your official rank.</p>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 pt-4">
            <Button 
              onClick={() => navigate('/start')}
              className="w-full bg-gold hover:bg-gold/90 text-background font-display h-12"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Create Account
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowAuthPrompt(false)}
              className="w-full border-border text-muted-foreground h-11"
            >
              Later
            </Button>
          </div>
          
          <p className="text-[10px] text-center text-muted-foreground pt-2">
            Your answers are saved — just sign up and submit
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
