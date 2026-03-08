import { useState, useEffect } from 'react';
import { X, Send, AlertCircle, Loader2, ChevronDown, MessageSquare } from 'lucide-react';
import GateIcon from '@/components/loopgate/GateIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface RequestJudgeReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedJudgeId?: string | null;
}

interface JudgeOption {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

const PLATFORMS = [
  { id: 'tiktok', label: 'TikTok', color: 'bg-pink-500' },
  { id: 'instagram', label: 'Instagram', color: 'bg-purple-500' },
  { id: 'youtube', label: 'YouTube', color: 'bg-red-500' },
];

const REVIEW_TAGS = [
  { id: 'honest', label: 'Be Honest', emoji: '💬' },
  { id: 'technical', label: 'Technical Review', emoji: '⚙️' },
  { id: 'vibes', label: 'Vibes Only', emoji: '✨' },
  { id: 'harsh', label: 'Roast Me', emoji: '🔥' },
  { id: 'tips', label: 'Give Me Tips', emoji: '📝' },
];

function detectPlatform(url: string): string | null {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('tiktok.com') || lowerUrl.includes('vm.tiktok') || lowerUrl.includes('vt.tiktok')) return 'tiktok';
  if (lowerUrl.includes('instagram.com') || lowerUrl.includes('instagr.am')) return 'instagram';
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
  return null;
}

export default function RequestJudgeReviewModal({ 
  isOpen, 
  onClose,
  preselectedJudgeId = null 
}: RequestJudgeReviewModalProps) {
  const { user, profile } = useAuth();
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [todayCount, setTodayCount] = useState<number | null>(null);
  
  // Judge selection
  const [judges, setJudges] = useState<JudgeOption[]>([]);
  const [selectedJudgeId, setSelectedJudgeId] = useState<string | null>(preselectedJudgeId);
  const [showJudgeSelect, setShowJudgeSelect] = useState(false);

  const DAILY_LIMIT = 3;
  const isJudgeAccount = profile?.username?.toLowerCase() === 'loopgate_hub';

  useEffect(() => {
    if (isOpen) {
      checkDailyLimit();
      fetchJudges();
      if (preselectedJudgeId) {
        setSelectedJudgeId(preselectedJudgeId);
      }
    }
  }, [isOpen, preselectedJudgeId]);

  async function checkDailyLimit() {
    if (!profile?.id) return;
    if (isJudgeAccount) {
      setTodayCount(0);
      return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('review_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .gte('requested_at', today);
    
    setTodayCount(count || 0);
  }

  async function fetchJudges() {
    // Fetch both 'judge' and 'trial_judge' roles
    const { data: judgeRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .in('role', ['judge', 'trial_judge']);

    if (!judgeRoles?.length) return;

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', judgeRoles.map(r => r.user_id));

    if (profiles) {
      setJudges(profiles);
    }
  }

  const handleUrlChange = (value: string) => {
    setUrl(value);
    const detected = detectPlatform(value);
    if (detected) setPlatform(detected);
  };

  const handleSubmit = async () => {
    if (!user || !profile?.id || !url.trim() || !platform) {
      toast.error('Please enter a valid edit URL');
      return;
    }
    
    if (!isJudgeAccount && todayCount !== null && todayCount >= DAILY_LIMIT) {
      toast.error(`You've reached the daily limit of ${DAILY_LIMIT} review requests`);
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('review_requests')
        .insert({
          user_id: user.id,
          username: profile.username,
          avatar_url: profile.avatar_url || null,
          submission_url: url.trim(),
          platform,
          status: 'pending',
          judge_id: selectedJudgeId || null,
          review_tag: selectedTag || null,
          notes: notes.trim() || null,
        });

      if (error) throw error;

      // Award XP for submitting
      await supabase.rpc('award_xp', {
        p_user_id: user.id,
        p_amount: 10,
        p_action: 'review_request',
        p_description: 'Requested a judge review',
      });

      toast.success('Review requested! A judge will rate your edit soon.');
      
      // Reset form
      setUrl('');
      setPlatform(null);
      setNotes('');
      setSelectedTag(null);
      setSelectedJudgeId(null);
      setTodayCount(null);
      onClose();
    } catch (error: any) {
      console.error('Error requesting review:', error);
      toast.error(error.message || 'Failed to request review');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedJudge = judges.find(j => j.id === selectedJudgeId);
  const hasReachedLimit = !isJudgeAccount && todayCount !== null && todayCount >= DAILY_LIMIT;
  const canSubmit = url.trim() && platform && !hasReachedLimit;
  const remainingRequests = isJudgeAccount ? '∞' : (todayCount !== null ? DAILY_LIMIT - todayCount : DAILY_LIMIT);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl overflow-hidden max-h-[85vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <div>
                <h2 className="font-display text-lg flex items-center gap-2">
                  <GateIcon className="w-4 h-4 text-gold" />
                  Request Review
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isJudgeAccount ? '∞ unlimited' : `${remainingRequests}/${DAILY_LIMIT} remaining today`}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-surface-1 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Submit Button - AT THE TOP */}
            <div className="p-4 border-b border-border shrink-0">
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="w-full bg-gold text-black hover:bg-gold/90 disabled:opacity-50 font-bold h-12 text-base"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit for Review
                  </>
                )}
              </Button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Daily limit warning */}
              {hasReachedLimit && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Daily Limit Reached</p>
                    <p className="text-xs text-muted-foreground">
                      Come back tomorrow for more reviews!
                    </p>
                  </div>
                </div>
              )}

              {/* Judge Selection (Optional) */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Choose Judge (Optional)
                </Label>
                <button
                  onClick={() => setShowJudgeSelect(!showJudgeSelect)}
                  className="w-full flex items-center justify-between p-3 bg-surface-1 border border-border rounded-lg hover:border-gold/50 transition-colors"
                >
                  {selectedJudge ? (
                    <div className="flex items-center gap-2">
                      {selectedJudge.avatar_url ? (
                        <img src={selectedJudge.avatar_url} className="w-6 h-6 rounded-full" alt="" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center">
                          <span className="text-xs font-bold text-gold">
                            {(selectedJudge.display_name || selectedJudge.username).charAt(0)}
                          </span>
                        </div>
                      )}
                      <span className="text-sm">@{selectedJudge.username}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Auto-match with available judge</span>
                  )}
                  <ChevronDown size={16} className={`transition-transform ${showJudgeSelect ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {showJudgeSelect && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="max-h-40 overflow-y-auto space-y-1 pt-2">
                        <button
                          onClick={() => {
                            setSelectedJudgeId(null);
                            setShowJudgeSelect(false);
                          }}
                          className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                            !selectedJudgeId ? 'bg-gold/10 border border-gold/30' : 'hover:bg-surface-1'
                          }`}
                        >
                          <div className="w-6 h-6 rounded-full bg-surface-1 flex items-center justify-center">
                            <Sparkles size={12} className="text-gold" />
                          </div>
                          <span className="text-sm">Auto-match</span>
                        </button>
                        
                        {judges.map((judge) => (
                          <button
                            key={judge.id}
                            onClick={() => {
                              setSelectedJudgeId(judge.id);
                              setShowJudgeSelect(false);
                            }}
                            className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                              selectedJudgeId === judge.id ? 'bg-gold/10 border border-gold/30' : 'hover:bg-surface-1'
                            }`}
                          >
                            {judge.avatar_url ? (
                              <img src={judge.avatar_url} className="w-6 h-6 rounded-full" alt="" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center">
                                <span className="text-xs font-bold text-gold">
                                  {(judge.display_name || judge.username).charAt(0)}
                                </span>
                              </div>
                            )}
                            <span className="text-sm">@{judge.username}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* URL Input */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Edit URL *
                </Label>
                <Input
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="Paste your TikTok, Instagram, or YouTube link..."
                  className="bg-surface-1 border-border"
                  disabled={hasReachedLimit}
                />
              </div>

              {/* Platform Selection */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Platform
                </Label>
                <div className="flex gap-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPlatform(p.id)}
                      disabled={hasReachedLimit}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all border ${
                        platform === p.id
                          ? `${p.color} text-white border-transparent`
                          : 'bg-surface-1 border-border hover:border-gold/50'
                      } disabled:opacity-50`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Tag Selection */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  What kind of review? (Optional)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {REVIEW_TAGS.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => setSelectedTag(selectedTag === tag.id ? null : tag.id)}
                      disabled={hasReachedLimit}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        selectedTag === tag.id
                          ? 'bg-gold/10 border-gold/50 text-gold'
                          : 'bg-surface-1 border-border hover:border-gold/30'
                      } disabled:opacity-50`}
                    >
                      {tag.emoji} {tag.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Notes */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <MessageSquare size={10} />
                  Notes for Judge (Optional)
                </Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any specific feedback you want? First edit? Trying something new?"
                  className="bg-surface-1 border-border resize-none h-20"
                  disabled={hasReachedLimit}
                />
              </div>

              {/* XP Info */}
              <div className="bg-gold/5 border border-gold/20 rounded-lg p-3 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  You'll earn <span className="text-gold font-bold">+10 XP</span> for submitting and{' '}
                  <span className="text-gold font-bold">+15 XP</span> when your review is complete!
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
