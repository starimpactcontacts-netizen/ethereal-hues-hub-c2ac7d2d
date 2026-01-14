import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Send, Trophy, Clock, AlertCircle, ExternalLink } from 'lucide-react';
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
  const { profile } = useAuth();
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
    if (!profile?.id) {
      toast.error('Please log in to submit');
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
  
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="border-b border-border/50 bg-surface-0/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold/10 border border-gold/30 flex items-center justify-center">
              <Target className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h1 className="font-display text-xl text-gold">Global QOI Test</h1>
              <p className="text-xs text-muted-foreground">Get your edit scored by a judge</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-6">
        {/* Pending Submission */}
        <AnimatePresence>
          {pendingSubmission && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-surface-0 border border-gold/30 p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-5 h-5 text-gold animate-pulse" />
                <span className="font-display text-gold">Awaiting Judgment</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Your submission is in the queue. A judge will score it soon.
              </p>
              <a 
                href={pendingSubmission.submission_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-gold flex items-center gap-1 hover:underline"
              >
                View submission <ExternalLink className="w-3 h-3" />
              </a>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Latest Result */}
        {latestSubmission && latestSubmission.status === 'scored' && (
          <div className="space-y-3">
            <h2 className="font-display text-lg text-foreground">Your Latest Score</h2>
            <GQTResultCard submission={latestSubmission} />
          </div>
        )}
        
        {/* Best Score */}
        {profile?.best_gatekeeper_qoi && (
          <div className="bg-gradient-to-r from-gold/10 to-transparent border border-gold/30 p-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-gold" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Personal Best QOI</p>
                <p className="font-display text-2xl text-gold">{profile.best_gatekeeper_qoi.toFixed(1)}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Submit Form */}
        {!pendingSubmission && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-surface-0 border border-border p-4 space-y-4">
              <h2 className="font-display text-lg text-foreground">Submit Your Edit</h2>
              
              {/* URL Input */}
              <div className="space-y-2">
                <Label htmlFor="url">Video URL</Label>
                <Input
                  id="url"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://tiktok.com/@handle/video/..."
                  className={urlError ? 'border-destructive' : ''}
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
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Platform:</span>
                <span className="text-foreground capitalize">{platform}</span>
              </div>
              
              {/* Optional Fields */}
              <div className="pt-4 border-t border-border space-y-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Optional Info (helps judges)</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="software">Editing Software</Label>
                    <Select value={editingSoftware} onValueChange={setEditingSoftware}>
                      <SelectTrigger id="software">
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
                    <Label htmlFor="years">Years Editing</Label>
                    <Select value={yearsEditing} onValueChange={setYearsEditing}>
                      <SelectTrigger id="years">
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
                    <Label htmlFor="style">Editing Style</Label>
                    <Select value={editingStyle} onValueChange={setEditingStyle}>
                      <SelectTrigger id="style">
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
                    <Label htmlFor="age">Age Range</Label>
                    <Select value={ageRange} onValueChange={setAgeRange}>
                      <SelectTrigger id="age">
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
                className="w-full bg-gold hover:bg-gold/90 text-background"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Submit for Review
                  </span>
                )}
              </Button>
            </div>
            
            {/* Info Section */}
            <div className="text-center space-y-2 text-sm text-muted-foreground">
              <p>Submissions are reviewed by real judges.</p>
              <p>Your best QOI score is saved to your profile.</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
