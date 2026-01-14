import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, AlertTriangle, Skull, ExternalLink, Clock, CheckCircle, Loader2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { validatePlatformUrl, detectPlatform, type PlatformType } from '@/lib/urlValidation';
import GatekeeperResultCard from '@/components/loopgate/GatekeeperResultCard';
import { JudgeArchetype, getArchetypeInfo, getRankProjection } from '@/data/judgeCommentary';

const EDITING_SOFTWARE = [
  'CapCut',
  'After Effects',
  'Premiere Pro',
  'DaVinci Resolve',
  'Sony Vegas',
  'Final Cut Pro',
  'Other'
];

const YEARS_EDITING = [
  'Less than 1 year',
  '1-2 years',
  '2-4 years',
  '4+ years'
];

const AGE_RANGES = [
  '13-17',
  '18-24',
  '25-34',
  '35+'
];

const EDITING_STYLES = [
  'Velocity / Flow',
  'AMV / Anime',
  'Fan Edit / Cinematic',
  'Motion Graphics',
  'Meme / Comedy',
  'Trailer Edit',
  'Sports Edit',
  'Other'
];

interface GatekeeperSubmission {
  id: string;
  submission_url: string;
  platform: string;
  status: string;
  qoi_score: number | null;
  quality_score: number | null;
  originality_score: number | null;
  impact_score: number | null;
  judge_archetype: JudgeArchetype | null;
  judge_commentary: string | null;
  rank_projection: string | null;
  house_fit: { houseId: string; houseName: string; fitLevel: string }[] | null;
  suggested_action: string | null;
  created_at: string;
}

export default function GatekeeperTestPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<'intro' | 'submit' | 'waiting' | 'result'>('intro');
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState<PlatformType | null>(null);
  const [urlError, setUrlError] = useState('');
  
  // Optional inputs
  const [software, setSoftware] = useState('');
  const [years, setYears] = useState('');
  const [age, setAge] = useState('');
  const [style, setStyle] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState<GatekeeperSubmission | null>(null);
  const [showResultCard, setShowResultCard] = useState(false);

  // Load existing pending submission
  useEffect(() => {
    if (user?.id) {
      loadExistingSubmission();
    }
  }, [user?.id]);

  // Realtime subscription for updates
  useEffect(() => {
    if (!currentSubmission?.id) return;

    const channel = supabase
      .channel('gatekeeper-result')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'gatekeeper_submissions',
          filter: `id=eq.${currentSubmission.id}`,
        },
        (payload) => {
          const updated = payload.new as GatekeeperSubmission;
          setCurrentSubmission(updated);
          if (updated.status === 'scored') {
            setStep('result');
            toast.success('Your result is ready!');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentSubmission?.id]);

  async function loadExistingSubmission() {
    const { data } = await supabase
      .from('gatekeeper_submissions')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setCurrentSubmission(data as GatekeeperSubmission);
      if (data.status === 'pending') {
        setStep('waiting');
      } else if (data.status === 'scored') {
        setStep('result');
      }
    }
  }

  function handleUrlChange(value: string) {
    setUrl(value);
    setUrlError('');
    
    const detected = detectPlatform(value);
    setPlatform(detected);
    
    if (value && detected) {
      const validation = validatePlatformUrl(value, detected);
      if (!validation.isValid) {
        setUrlError(validation.error || 'Invalid URL');
      }
    }
  }

  async function handleSubmit() {
    if (!user?.id || !url || !platform) return;

    const validation = validatePlatformUrl(url, platform);
    if (!validation.isValid) {
      setUrlError(validation.error || 'Invalid URL');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from('gatekeeper_submissions')
        .insert({
          user_id: user.id,
          submission_url: url,
          platform,
          editing_software: software || null,
          years_editing: years || null,
          age_range: age || null,
          editing_style: style || null,
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentSubmission(data as GatekeeperSubmission);
      setStep('waiting');
      toast.success('Submission received! Awaiting judgment...');
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleNewTest() {
    setCurrentSubmission(null);
    setUrl('');
    setPlatform(null);
    setSoftware('');
    setYears('');
    setAge('');
    setStyle('');
    setStep('intro');
  }

  const getPlatformIcon = (p: PlatformType | null) => {
    switch (p) {
      case 'tiktok': return '📱';
      case 'instagram': return '📷';
      case 'youtube': return '▶️';
      default: return '🔗';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Skull className="w-5 h-5 text-gold" />
            <span className="font-display text-lg">Gatekeeper Test</span>
          </div>
          <div className="w-9" />
        </div>
      </div>

      <div className="px-4 py-6">
        <AnimatePresence mode="wait">
          {/* INTRO STEP */}
          {step === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Warning Banner */}
              <div className="relative overflow-hidden bg-gold/10 border-2 border-gold/50 p-6">
                <div className="absolute inset-0 opacity-10">
                  <div 
                    className="absolute inset-0"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 20px)',
                    }}
                  />
                </div>
                <div className="relative flex items-center gap-4">
                  <AlertTriangle className="w-12 h-12 text-gold flex-shrink-0" />
                  <div>
                    <h1 className="font-display text-2xl text-gold mb-1">Face the Judge</h1>
                    <p className="text-sm text-muted-foreground">
                      Submit an edit. Receive brutally honest QOI scoring and feedback from the Gatekeeper.
                    </p>
                  </div>
                </div>
              </div>

              {/* What You Get */}
              <div className="space-y-3">
                <h2 className="font-display text-lg">What You'll Receive</h2>
                <div className="grid gap-2">
                  {[
                    { icon: '⚖️', label: 'QOI Score', desc: 'Quality + Originality + Impact' },
                    { icon: '🏆', label: 'Rank Projection', desc: 'Where you would place' },
                    { icon: '🏠', label: 'House Fit Analysis', desc: 'Which houses match your style' },
                    { icon: '💀', label: 'Judge Commentary', desc: 'Brutal or hype. No in-between.' },
                    { icon: '📤', label: 'Shareable Result', desc: 'Flex it or fix it' },
                  ].map((item, i) => (
                    <div key={i} className="bg-surface-1 border border-border p-3 flex items-center gap-3">
                      <span className="text-xl">{item.icon}</span>
                      <div>
                        <p className="font-semibold text-sm">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warning */}
              <div className="bg-destructive/10 border border-destructive/30 p-4">
                <p className="text-sm text-center">
                  <strong className="text-destructive">Warning:</strong> Feedback may be brutal. 
                  This is not a safe space. Enter only if you can handle the truth.
                </p>
              </div>

              <Button 
                onClick={() => setStep('submit')}
                className="w-full bg-gold hover:bg-gold/90 text-black font-display text-lg h-14"
              >
                <Skull className="mr-2 w-5 h-5" />
                I'm Ready
              </Button>
            </motion.div>
          )}

          {/* SUBMIT STEP */}
          {step === 'submit' && (
            <motion.div
              key="submit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* URL Input */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Your Edit URL *</Label>
                <div className="relative">
                  <Input
                    value={url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="Paste TikTok, Instagram, or YouTube link"
                    className={`h-14 text-lg pr-12 ${urlError ? 'border-destructive' : platform ? 'border-green-500' : ''}`}
                  />
                  {platform && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl">
                      {getPlatformIcon(platform)}
                    </span>
                  )}
                </div>
                {urlError && (
                  <p className="text-xs text-destructive">{urlError}</p>
                )}
                {platform && !urlError && (
                  <p className="text-xs text-green-500 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {platform.charAt(0).toUpperCase() + platform.slice(1)} link detected
                  </p>
                )}
              </div>

              {/* Optional Inputs */}
              <div className="space-y-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-widest">
                  Optional — Helps calibrate feedback
                </p>

                {/* Software */}
                <div className="space-y-2">
                  <Label className="text-sm">Editing Software</Label>
                  <div className="flex flex-wrap gap-2">
                    {EDITING_SOFTWARE.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSoftware(software === s ? '' : s)}
                        className={`px-3 py-1.5 text-xs border transition-colors ${
                          software === s 
                            ? 'bg-gold/20 border-gold text-gold' 
                            : 'bg-surface-1 border-border hover:border-gold/50'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Years Editing */}
                <div className="space-y-2">
                  <Label className="text-sm">Years Editing</Label>
                  <div className="flex flex-wrap gap-2">
                    {YEARS_EDITING.map((y) => (
                      <button
                        key={y}
                        onClick={() => setYears(years === y ? '' : y)}
                        className={`px-3 py-1.5 text-xs border transition-colors ${
                          years === y 
                            ? 'bg-gold/20 border-gold text-gold' 
                            : 'bg-surface-1 border-border hover:border-gold/50'
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age Range */}
                <div className="space-y-2">
                  <Label className="text-sm">Age Range</Label>
                  <div className="flex flex-wrap gap-2">
                    {AGE_RANGES.map((a) => (
                      <button
                        key={a}
                        onClick={() => setAge(age === a ? '' : a)}
                        className={`px-3 py-1.5 text-xs border transition-colors ${
                          age === a 
                            ? 'bg-gold/20 border-gold text-gold' 
                            : 'bg-surface-1 border-border hover:border-gold/50'
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Editing Style */}
                <div className="space-y-2">
                  <Label className="text-sm">Editing Style</Label>
                  <div className="flex flex-wrap gap-2">
                    {EDITING_STYLES.map((s) => (
                      <button
                        key={s}
                        onClick={() => setStyle(style === s ? '' : s)}
                        className={`px-3 py-1.5 text-xs border transition-colors ${
                          style === s 
                            ? 'bg-gold/20 border-gold text-gold' 
                            : 'bg-surface-1 border-border hover:border-gold/50'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSubmit}
                disabled={!url || !platform || !!urlError || isSubmitting}
                className="w-full bg-gold hover:bg-gold/90 text-black font-display text-lg h-14 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-2 w-5 h-5" />
                    Submit for Judgment
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {/* WAITING STEP */}
          {step === 'waiting' && currentSubmission && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center py-12">
                <div className="relative inline-block mb-6">
                  <div className="w-24 h-24 bg-gold/10 border-2 border-gold/50 flex items-center justify-center">
                    <Clock className="w-10 h-10 text-gold" />
                  </div>
                  <div className="absolute inset-0 border-2 border-gold/30 animate-ping" />
                </div>
                
                <h2 className="font-display text-2xl text-gold mb-2">Awaiting Judgment</h2>
                <p className="text-muted-foreground mb-6">
                  Your edit has been submitted to the Gatekeeper. 
                  Results typically arrive within 24 hours.
                </p>

                {/* Submission Info */}
                <div className="bg-surface-1 border border-border p-4 text-left mb-6">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Your Submission</p>
                  <a 
                    href={currentSubmission.submission_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gold hover:underline flex items-center gap-2"
                  >
                    {getPlatformIcon(currentSubmission.platform as PlatformType)} 
                    View on {currentSubmission.platform}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <p className="text-xs text-muted-foreground mt-2">
                    Submitted {new Date(currentSubmission.created_at).toLocaleDateString()}
                  </p>
                </div>

                <p className="text-xs text-muted-foreground">
                  You'll be notified when your result is ready. This page updates automatically.
                </p>
              </div>
            </motion.div>
          )}

          {/* RESULT STEP */}
          {step === 'result' && currentSubmission && currentSubmission.qoi_score && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Big Score Display */}
              <div className="text-center py-8 bg-gradient-to-b from-gold/10 to-transparent border border-gold/30">
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] mb-2">Your QOI Score</p>
                <p className="font-display text-8xl text-gold">{currentSubmission.qoi_score.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {getRankProjection(currentSubmission.qoi_score).tier} {getRankProjection(currentSubmission.qoi_score).level} • {getRankProjection(currentSubmission.qoi_score).description}
                </p>
              </div>

              {/* Score Breakdown */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-surface-1 border border-border p-4 text-center">
                  <p className="font-display text-3xl">{currentSubmission.quality_score}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Quality</p>
                </div>
                <div className="bg-surface-1 border border-border p-4 text-center">
                  <p className="font-display text-3xl">{currentSubmission.originality_score}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Originality</p>
                </div>
                <div className="bg-surface-1 border border-border p-4 text-center">
                  <p className="font-display text-3xl">{currentSubmission.impact_score}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Impact</p>
                </div>
              </div>

              {/* Judge Commentary */}
              {currentSubmission.judge_commentary && currentSubmission.judge_archetype && (
                <div className="bg-gold/5 border border-gold/30 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{getArchetypeInfo(currentSubmission.judge_archetype).icon}</span>
                    <span className="font-display text-sm text-gold">
                      {getArchetypeInfo(currentSubmission.judge_archetype).name}
                    </span>
                  </div>
                  <p className="text-xl italic">"{currentSubmission.judge_commentary}"</p>
                </div>
              )}

              {/* Suggested Action */}
              {currentSubmission.suggested_action && (
                <div className="bg-surface-1 border border-border p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Next Step</p>
                  <p className="text-sm">{currentSubmission.suggested_action}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button 
                  onClick={() => setShowResultCard(true)}
                  className="flex-1 bg-gold hover:bg-gold/90 text-black font-display h-12"
                >
                  <Share2 className="mr-2 w-5 h-5" />
                  Share Result
                </Button>
                <Button 
                  onClick={handleNewTest}
                  variant="outline"
                  className="flex-1 font-display h-12"
                >
                  New Test
                </Button>
              </div>

              {/* Link to Join Event */}
              <Link to="/hub">
                <Button variant="outline" className="w-full font-display h-12">
                  Back to Hub
                </Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Shareable Result Card Modal */}
      {currentSubmission && currentSubmission.qoi_score && (
        <GatekeeperResultCard
          isOpen={showResultCard}
          onClose={() => setShowResultCard(false)}
          data={{
            username: profile?.username || 'Editor',
            displayName: profile?.display_name || undefined,
            qoiScore: currentSubmission.qoi_score,
            qualityScore: currentSubmission.quality_score || 0,
            originalityScore: currentSubmission.originality_score || 0,
            impactScore: currentSubmission.impact_score || 0,
            judgeArchetype: currentSubmission.judge_archetype || 'realist',
            judgeCommentary: currentSubmission.judge_commentary || '',
            rankProjection: currentSubmission.rank_projection || '',
            houseFit: currentSubmission.house_fit || undefined,
            suggestedAction: currentSubmission.suggested_action || undefined,
          }}
        />
      )}
    </div>
  );
}
