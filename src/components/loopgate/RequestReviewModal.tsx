import { useState } from 'react';
import { X, Send, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RequestReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PLATFORMS = [
  { id: 'tiktok', label: 'TikTok', color: 'bg-pink-500' },
  { id: 'instagram', label: 'Instagram', color: 'bg-purple-500' },
  { id: 'youtube', label: 'YouTube', color: 'bg-red-500' },
];

function detectPlatform(url: string): string | null {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('tiktok.com') || lowerUrl.includes('vm.tiktok')) return 'tiktok';
  if (lowerUrl.includes('instagram.com') || lowerUrl.includes('instagr.am')) return 'instagram';
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
  return null;
}

export default function RequestReviewModal({ isOpen, onClose }: RequestReviewModalProps) {
  const { profile } = useAuth();
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [todayCount, setTodayCount] = useState<number | null>(null);

  const DAILY_LIMIT = 3;

  // Check daily limit on open
  const checkDailyLimit = async () => {
    if (!profile?.id) return;
    
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('review_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .gte('requested_at', today);
    
    setTodayCount(count || 0);
  };

  // Check limit when modal opens
  if (isOpen && todayCount === null) {
    checkDailyLimit();
  }

  const handleUrlChange = (value: string) => {
    setUrl(value);
    const detected = detectPlatform(value);
    if (detected) setPlatform(detected);
  };

  const handleSubmit = async () => {
    if (!profile?.id || !url.trim() || !platform) return;
    
    if (todayCount !== null && todayCount >= DAILY_LIMIT) {
      toast.error(`You've reached the daily limit of ${DAILY_LIMIT} review requests`);
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('review_requests')
        .insert({
          user_id: profile.id,
          username: profile.username,
          avatar_url: profile.avatar_url || null,
          submission_url: url.trim(),
          platform,
          status: 'pending',
        });

      if (error) throw error;

      toast.success('Review requested! A judge will rate your edit soon.');
      setUrl('');
      setPlatform(null);
      setTodayCount(null);
      onClose();
    } catch (error: any) {
      console.error('Error requesting review:', error);
      toast.error(error.message || 'Failed to request review');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = url.trim() && platform && todayCount !== null && todayCount < DAILY_LIMIT;
  const remainingRequests = todayCount !== null ? DAILY_LIMIT - todayCount : DAILY_LIMIT;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl overflow-hidden mb-safe max-h-[85vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h2 className="font-display text-lg">Request Judge Review</h2>
                <p className="text-xs text-muted-foreground">
                  {remainingRequests} of {DAILY_LIMIT} requests remaining today
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-surface-1 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Daily limit warning */}
              {todayCount !== null && todayCount >= DAILY_LIMIT && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Daily Limit Reached</p>
                    <p className="text-xs text-muted-foreground">
                      You can request {DAILY_LIMIT} reviews per day. Come back tomorrow!
                    </p>
                  </div>
                </div>
              )}

              {/* URL Input */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Edit URL
                </Label>
                <Input
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="Paste your TikTok, Instagram, or YouTube link..."
                  className="bg-surface-1 border-border"
                  disabled={todayCount !== null && todayCount >= DAILY_LIMIT}
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
                      disabled={todayCount !== null && todayCount >= DAILY_LIMIT}
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

              {/* Info */}
              <div className="bg-surface-1 border border-border rounded-lg p-3 space-y-2">
                <p className="text-xs text-muted-foreground">
                  <span className="text-foreground font-medium">How it works:</span> A QOI Judge will review your edit and provide a 5-pillar score breakdown with feedback.
                </p>
                <p className="text-xs text-muted-foreground">
                  You'll receive a notification when your review is complete. Results appear in your profile.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border">
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="w-full bg-gold text-black hover:bg-gold/90 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Request Review
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
