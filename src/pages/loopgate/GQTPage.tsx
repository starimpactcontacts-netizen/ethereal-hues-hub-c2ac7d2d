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
import { Send, Clock, AlertCircle, ExternalLink, LogIn, Zap, RefreshCw, ChevronLeft, ArrowRight, Crosshair, Shield } from 'lucide-react';
import { validatePlatformUrl, detectPlatform, type PlatformType } from '@/lib/urlValidation';
import { toast } from 'sonner';
import GQTResultCard from '@/components/loopgate/GQTResultCard';
import GatePattern from '@/components/loopgate/GatePattern';
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

  // Shared select question renderer
  const renderQuestion = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    options: readonly { readonly value: string; readonly label: string }[],
    placeholder: string,
    noteValue: string,
    onNoteChange: (v: string) => void,
    notePrompt: string,
    index: number,
  ) => (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="space-y-2"
    >
      <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-11 bg-background/50 border-border/40 hover:border-foreground/20 transition-colors text-sm">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value === 'other' && (
        <Textarea
          placeholder={notePrompt}
          value={noteValue}
          onChange={(e) => onNoteChange(e.target.value)}
          className="mt-1.5 text-sm resize-none bg-background/50 border-border/40"
          rows={2}
        />
      )}
    </motion.div>
  );
  
  return (
    <div className="min-h-screen bg-background pb-24 relative">
      {/* Background pattern */}
      <GatePattern opacity={4} tileSize={56} />
      
      {/* Architectural top line */}
      <div className="h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />

      {/* ═══════════════ HERO ═══════════════ */}
      <div className="relative px-4 pt-8 pb-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,hsl(var(--gold)/0.04),transparent_60%)]" />
        
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative max-w-lg mx-auto text-center"
        >
          {/* Crosshair icon */}
          <div className="w-14 h-14 mx-auto mb-4 border border-foreground/10 flex items-center justify-center relative">
            <Crosshair className="w-6 h-6 text-foreground/60" />
            <div className="absolute inset-0 border border-foreground/5" style={{ transform: 'rotate(45deg) scale(0.7)' }} />
          </div>
          
          <p className="text-[10px] text-gold/80 uppercase tracking-[0.4em] font-semibold mb-2">Advanced Evaluation</p>
          <h1 className="font-display text-4xl sm:text-5xl text-foreground tracking-[0.08em] mb-2">
            QOI TEST
          </h1>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Submit your best edit. Get evaluated by real judges. Receive your official class ranking.
          </p>
          
          {/* Best Score */}
          {bestScore && rank && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-5 inline-flex items-center gap-3 px-4 py-2.5 border border-border/40 bg-surface-1/40 backdrop-blur-sm"
            >
              <div>
                <p className="text-[8px] text-muted-foreground uppercase tracking-[0.2em]">Your Best</p>
                <span className={`font-display text-2xl ${rank.color}`}>{bestScore.toFixed(0)}</span>
                <span className="text-[10px] text-muted-foreground ml-0.5">/100</span>
              </div>
              <div className="w-px h-8 bg-border/40" />
              <div>
                <p className="text-[8px] text-muted-foreground uppercase tracking-[0.2em]">Class</p>
                <span className={`font-display text-2xl ${rank.color}`}>{rank.rank}</span>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

      {/* ═══════════════ CONTENT ═══════════════ */}
      <div className="px-4 pt-5 max-w-lg mx-auto space-y-4">
        
        {/* Cooldown Banner */}
        {cooldownDays !== null && cooldownDays > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between px-4 py-3 border border-border/30 bg-surface-1/30"
          >
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Clock className="w-4 h-4 text-foreground/40" />
              <span className="text-xs">Cooldown active</span>
            </div>
            <span className="text-xs font-display text-foreground tracking-wide">
              {cooldownDays}d remaining
            </span>
          </motion.div>
        )}

        {/* ═══ Pending Submission ═══ */}
        <AnimatePresence mode="wait">
          {pendingSubmission && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              <Link 
                to={pendingSubmission.submission_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block border border-gold/20 bg-gold/[0.03] hover:border-gold/30 transition-all p-5"
              >
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 border border-gold/30 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-gold/70" />
                    </div>
                    <div className="absolute inset-0 border border-gold/15 animate-ping opacity-30" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-gold/70 uppercase tracking-[0.2em] font-semibold">Awaiting Judgment</span>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      Your submission is in the queue
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gold/50 group-hover:text-gold/80 transition-colors shrink-0" />
                </div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* ═══ Latest Result ═══ */}
        {latestSubmission && latestSubmission.status === 'scored' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg text-foreground tracking-wide">Your Results</h2>
              {cooldownDays === null || cooldownDays <= 0 ? (
                <button
                  onClick={handleRetake}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retake
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
                <Button className="w-full h-11 bg-gold hover:bg-gold/90 text-gold-foreground font-display tracking-wide">
                  <Zap className="w-4 h-4 mr-2" />
                  Arena
                </Button>
              </Link>
              {cooldownDays !== null && cooldownDays > 0 ? (
                <Button variant="outline" disabled className="h-11 border-border/40 text-muted-foreground">
                  <Clock className="w-4 h-4 mr-2" />
                  {cooldownDays}d Cooldown
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleRetake}
                  className="h-11 border-border/40 hover:border-foreground/20 hover:text-foreground"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  New Edit
                </Button>
              )}
            </div>
          </motion.div>
        )}
        
        {/* ═══ Submit Flow ═══ */}
        {!pendingSubmission && !latestSubmission && (
          <AnimatePresence mode="wait">
            {step === 'form' ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="space-y-4"
              >
                {/* Submit Card */}
                <div className="relative border border-border/30 bg-surface-1/20 backdrop-blur-sm overflow-hidden">
                  {/* Decorative corner marks */}
                  <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-foreground/10" />
                  <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-foreground/10" />
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-foreground/10" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-foreground/10" />
                  
                  <div className="p-5 sm:p-6 space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 border border-foreground/10 flex items-center justify-center shrink-0">
                        <Shield className="w-5 h-5 text-foreground/50" />
                      </div>
                      <div>
                        <h2 className="font-display text-xl text-foreground tracking-wide">Submit Your Edit</h2>
                        <p className="text-[10px] text-muted-foreground tracking-wide">Get scored by real judges</p>
                      </div>
                    </div>
                    
                    {/* URL Input */}
                    <div className="space-y-2">
                      <Label htmlFor="url" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">
                        Video URL
                      </Label>
                      <Input
                        id="url"
                        value={url}
                        onChange={(e) => handleUrlChange(e.target.value)}
                        placeholder="https://tiktok.com/@handle/video/..."
                        className={`h-12 bg-background/50 text-sm ${urlError ? 'border-destructive' : 'border-border/40 focus:border-foreground/30'}`}
                      />
                      {urlError && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {urlError}
                        </p>
                      )}
                    </div>
                    
                    {/* Platform Selector */}
                    <div className="space-y-2">
                      <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">Platform</Label>
                      <Select value={platform} onValueChange={(v) => setPlatform(v as PlatformType)}>
                        <SelectTrigger className="h-11 bg-background/50 border-border/40 hover:border-foreground/20 transition-colors text-sm capitalize">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tiktok">TikTok</SelectItem>
                          <SelectItem value="instagram">Instagram Reels</SelectItem>
                          <SelectItem value="youtube">YouTube / Shorts</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* CTA */}
                    <Button
                      onClick={handleProceedToInterrogation}
                      disabled={!url}
                      className="w-full h-12 bg-foreground hover:bg-foreground/90 text-background font-display text-sm tracking-wide"
                    >
                      <span className="flex items-center gap-2">
                        Continue
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </Button>
                    
                    <p className="text-[9px] text-center text-muted-foreground tracking-wide">
                      Supports TikTok, Instagram Reels, and YouTube Shorts
                    </p>
                  </div>
                </div>

                {/* Info Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-border/20 bg-surface-1/20 p-4">
                    <p className="font-display text-lg text-foreground tracking-wide">24-48h</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-[0.15em] mt-0.5">Review Time</p>
                  </div>
                  <div className="border border-border/20 bg-surface-1/20 p-4">
                    <p className="font-display text-lg text-foreground tracking-wide">7 Days</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-[0.15em] mt-0.5">Cooldown</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="interrogation"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                className="space-y-4"
              >
                {/* Interrogation Header */}
                <div className="relative border border-border/30 bg-surface-1/20 backdrop-blur-sm overflow-hidden">
                  <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-foreground/10" />
                  <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-foreground/10" />
                  
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 border border-foreground/10 flex items-center justify-center">
                        <Crosshair className="w-5 h-5 text-foreground/50" />
                      </div>
                      <div>
                        <h2 className="font-display text-xl text-foreground tracking-wide">Interrogation</h2>
                        <p className="text-[10px] text-muted-foreground tracking-wide">Answer honestly for better feedback</p>
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

                {/* Questions */}
                <div className="relative border border-border/30 bg-surface-1/20 backdrop-blur-sm overflow-hidden">
                  <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-foreground/10" />
                  <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-foreground/10" />
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-foreground/10" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-foreground/10" />
                  
                  <div className="p-5 sm:p-6 space-y-5">
                    {renderQuestion('Editor Type', editorType, setEditorType, editorTypes, 'Select your style...', editorTypeNote, setEditorTypeNote, 'Tell us what type of editor you are...', 0)}
                    {renderQuestion('Experience', yearsEditing, setYearsEditing, yearsEditingOptions, 'How long have you been editing...', yearsEditingNote, setYearsEditingNote, 'Explain your editing experience...', 1)}
                    {renderQuestion('Software', editingSoftware, setEditingSoftware, softwareOptions, 'Select software...', editingSoftwareNote, setEditingSoftwareNote, 'What software do you use?', 2)}
                    {renderQuestion('Editing Speed', editingSpeed, setEditingSpeed, editingSpeedOptions, 'How fast do you edit...', editingSpeedNote, setEditingSpeedNote, 'Describe your editing pace...', 3)}
                    {renderQuestion('Intention', testPurpose, setTestPurpose, testPurposeOptions, 'Why are you here...', testPurposeNote, setTestPurposeNote, "What's your intention?", 4)}
                    
                    {/* Confidence Slider */}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">Confidence</Label>
                        <span className={`text-sm font-display tracking-wide ${confidenceLevel >= 7 ? 'text-gold' : 'text-foreground'}`}>
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
                      <p className="text-[10px] text-center text-muted-foreground italic">
                        "{confidenceLabels[confidenceLevel]}"
                      </p>
                    </motion.div>
                    
                    {renderQuestion('Goal', editingGoal, setEditingGoal, editingGoalOptions, "What's your editing goal...", editingGoalNote, setEditingGoalNote, "What's your editing goal?", 6)}
                  </div>
                </div>
                
                {/* Submit */}
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !canProceed}
                  className="w-full h-12 bg-foreground hover:bg-foreground/90 text-background font-display text-sm tracking-wide"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Submit for Judgment
                    </span>
                  )}
                </Button>
                
                <p className="text-[9px] text-center text-muted-foreground tracking-wide">
                  Reviewed by real judges · Best score saved to profile
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
      
      {/* Auth Prompt Dialog */}
      <Dialog open={showAuthPrompt} onOpenChange={setShowAuthPrompt}>
        <DialogContent className="bg-surface-0 border border-border/40 max-w-sm">
          <DialogHeader>
            <div className="w-14 h-14 mx-auto mb-4 border border-foreground/10 flex items-center justify-center">
              <LogIn className="w-7 h-7 text-foreground/60" />
            </div>
            <DialogTitle className="font-display text-2xl text-center text-foreground tracking-wide">
              Almost There
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground text-xs">
              Create a free account to submit and get your official rank.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 pt-4">
            <Button 
              onClick={() => navigate('/start')}
              className="w-full bg-foreground hover:bg-foreground/90 text-background font-display h-11 tracking-wide"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Create Account
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowAuthPrompt(false)}
              className="w-full border-border/40 text-muted-foreground h-10"
            >
              Later
            </Button>
          </div>
          
          <p className="text-[9px] text-center text-muted-foreground pt-2">
            Your answers are saved — just sign up and submit
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
