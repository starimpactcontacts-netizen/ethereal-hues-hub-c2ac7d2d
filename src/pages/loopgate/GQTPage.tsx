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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Target, Send, Trophy, Clock, AlertCircle, ExternalLink, LogIn, Zap, RefreshCw, Play } from 'lucide-react';
import { validatePlatformUrl, detectPlatform, type PlatformType } from '@/lib/urlValidation';
import { toast } from 'sonner';
import GQTResultCard from '@/components/loopgate/GQTResultCard';
import type { Json } from '@/integrations/supabase/types';

interface GQTSubmission {
  id: string;
  submission_url: string;
  platform: string;
  status: string;
  qoi_score: number | null;
  quality_score: number | null;
  originality_score: number | null;
  impact_score: number | null;
  judge_commentary: string | null;
  judge_archetype: string | null;
  created_at: string;
  judged_at: string | null;
  editing_software: string | null;
  years_editing: string | null;
  editing_style: string | null;
  age_range: string | null;
  rank_projection: string | null;
  suggested_action: string | null;
  house_fit: { houseId: string; houseName: string; fitLevel: string }[] | null;
}

export default function GQTPage() {
  const { user, profile } = useAuth();
  const { isGuest } = useGuestMode();
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState<PlatformType>('tiktok');
  const [editingSoftware, setEditingSoftware] = useState('');
  const [yearsEditing, setYearsEditing] = useState('');
  const [editingStyle, setEditingStyle] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [latestSubmission, setLatestSubmission] = useState<GQTSubmission | null>(null);
  const [pendingSubmission, setPendingSubmission] = useState<GQTSubmission | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  
  // Check if user is authenticated (not guest)
  const isAuthenticated = !!user && !isGuest;
  
  // Load latest submission on mount
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
    
    // Auto-detect platform
    const detected = detectPlatform(value);
    if (detected) {
      setPlatform(detected);
    }
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
  
  const handleSubmit = async () => {
    // Guest users: show auth prompt instead of submitting
    if (!isAuthenticated || !profile?.id) {
      setShowAuthPrompt(true);
      return;
    }
    
    if (!validateUrl()) return;
    
    // Validate platform
    const detected = detectPlatform(url);
    if (!detected) {
      toast.error('Could not detect platform from URL');
      return;
    }
    
    const validation = validatePlatformUrl(detected, url);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid URL');
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
          editing_software: editingSoftware || null,
          years_editing: yearsEditing || null,
          editing_style: editingStyle || null,
          age_range: ageRange || null,
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
      setUrl('');
      setEditingSoftware('');
      setYearsEditing('');
      setEditingStyle('');
      setAgeRange('');
      toast.success('Submission received! A judge will review it soon.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = () => {
    setLatestSubmission(null);
    setPendingSubmission(null);
  };
  
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header with hazard stripes */}
      <div className="relative border-b border-gold/30 bg-gradient-to-r from-background via-surface-0 to-background overflow-hidden">
        {/* Hazard stripe pattern */}
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
              {/* Pulse effect */}
              <div className="absolute inset-0 border-2 border-gold/50 animate-ping opacity-30" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-3xl text-gold">GLOBAL QOI TEST</h1>
                <Zap className="w-5 h-5 text-gold/60" />
              </div>
              <p className="text-sm text-muted-foreground italic mt-1">
                "Submit an edit. Get your score."
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
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Your Best QOI Score</p>
                  <p className="font-display text-4xl text-gold">{profile.best_gatekeeper_qoi.toFixed(1)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Personal Record</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pending Submission - Awaiting Judgment */}
        <AnimatePresence mode="wait">
          {pendingSubmission && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gradient-to-br from-gold/10 via-surface-0 to-surface-1 border-2 border-gold/50 p-6"
            >
              {/* Pulsing clock icon */}
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
            <GQTResultCard submission={latestSubmission} />
            
            {/* CTAs */}
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
        
        {/* Submit Form */}
        {!pendingSubmission && !latestSubmission && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-surface-0 border border-border p-5 space-y-5">
              <h2 className="font-display text-xl text-foreground">SUBMIT YOUR EDIT</h2>
              
              {/* URL Input */}
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
              
              {/* Platform Display */}
              <div className="flex items-center gap-2 text-sm px-3 py-2 bg-surface-1 border border-border">
                <span className="text-muted-foreground">Platform detected:</span>
                <span className="text-foreground font-semibold capitalize">{platform}</span>
              </div>
              
              {/* Optional Fields */}
              <div className="pt-4 border-t border-border space-y-4">
                <p className="text-xs text-muted-foreground uppercase tracking-widest">
                  Optional — helps judges provide better feedback
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="software" className="text-xs">Editing Software</Label>
                    <Select value={editingSoftware} onValueChange={setEditingSoftware}>
                      <SelectTrigger id="software" className="h-10">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="premiere">Premiere Pro</SelectItem>
                        <SelectItem value="aftereffects">After Effects</SelectItem>
                        <SelectItem value="finalcut">Final Cut Pro</SelectItem>
                        <SelectItem value="davinci">DaVinci Resolve</SelectItem>
                        <SelectItem value="capcut">CapCut</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="years" className="text-xs">Years Editing</Label>
                    <Select value={yearsEditing} onValueChange={setYearsEditing}>
                      <SelectTrigger id="years" className="h-10">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="<1">Less than 1 year</SelectItem>
                        <SelectItem value="1-2">1-2 years</SelectItem>
                        <SelectItem value="3-5">3-5 years</SelectItem>
                        <SelectItem value="5+">5+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="style" className="text-xs">Editing Style</Label>
                    <Select value={editingStyle} onValueChange={setEditingStyle}>
                      <SelectTrigger id="style" className="h-10">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="amv">AMV</SelectItem>
                        <SelectItem value="gaming">Gaming</SelectItem>
                        <SelectItem value="sports">Sports</SelectItem>
                        <SelectItem value="cinematic">Cinematic</SelectItem>
                        <SelectItem value="meme">Meme/Comedy</SelectItem>
                        <SelectItem value="vlog">Vlog</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="age" className="text-xs">Age Range</Label>
                    <Select value={ageRange} onValueChange={setAgeRange}>
                      <SelectTrigger id="age" className="h-10">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="13-17">13-17</SelectItem>
                        <SelectItem value="18-24">18-24</SelectItem>
                        <SelectItem value="25-34">25-34</SelectItem>
                        <SelectItem value="35+">35+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !url}
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
                    SUBMIT FOR REVIEW
                  </span>
                )}
              </Button>
            </div>
            
            {/* Info Section */}
            <div className="text-center space-y-2 text-sm text-muted-foreground px-4">
              <p>Submissions are reviewed by real judges.</p>
              <p className="text-gold">Your best QOI score is saved to your profile.</p>
            </div>
          </motion.div>
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
              READY TO GET SCORED?
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              Sign in or create an account to submit your edit and get your official QOI score from a real judge.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 pt-4">
            <Button 
              onClick={() => navigate('/auth')}
              className="w-full bg-gold hover:bg-gold/90 text-background font-display h-14 text-lg"
            >
              <LogIn className="w-5 h-5 mr-2" />
              SIGN IN / SIGN UP
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowAuthPrompt(false)}
              className="w-full border-border text-muted-foreground h-12"
            >
              Keep Browsing
            </Button>
          </div>
          
          <p className="text-xs text-center text-muted-foreground pt-2">
            Your form data is saved — just sign in and hit submit again.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
