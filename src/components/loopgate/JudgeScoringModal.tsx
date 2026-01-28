import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Sparkles, ExternalLink, Loader2, Download, Share2, Send,
  Heart, Lightbulb, Music, Fingerprint, Zap, MessageSquare
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useThumbnail } from '@/hooks/useThumbnail';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { awardReviewXP } from '@/hooks/useJudgeXP';
import JudgeCardExport from './JudgeCardExport';

interface ReviewRequest {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  submission_url: string;
  platform: string;
}

// Scoring modes
type ScoringMode = 'full' | 'vibes' | 'two_pillar' | 'tier_only';

const SCORING_MODES = [
  { id: 'full' as const, label: 'Full QOI', desc: '5 pillars' },
  { id: 'vibes' as const, label: 'Vibes', desc: '1 score' },
  { id: 'two_pillar' as const, label: 'Quick', desc: '2 pillars' },
  { id: 'tier_only' as const, label: 'Tier', desc: 'S-F only' },
];

// Score pillars for full mode (matching JudgeReviewCard: 15+25+25+10+25=100)
const PILLARS = [
  { id: 'emotion', label: 'Emotion', max: 15, icon: Heart, color: 'text-pink-400' },
  { id: 'creativity', label: 'Creativity', max: 25, icon: Lightbulb, color: 'text-yellow-400' },
  { id: 'sync', label: 'Sync', max: 25, icon: Music, color: 'text-purple-400' },
  { id: 'identity', label: 'Identity', max: 10, icon: Fingerprint, color: 'text-blue-400' },
  { id: 'execution', label: 'Execution', max: 25, icon: Zap, color: 'text-green-400' },
];

const TIERS = ['S', 'A', 'B', 'C', 'D', 'F'] as const;
const TIER_SCORES: Record<string, number> = {
  'S': 90, 'A': 75, 'B': 60, 'C': 45, 'D': 30, 'F': 15
};

interface JudgeScoringModalProps {
  request: ReviewRequest;
  onClose: () => void;
  onComplete: () => void;
}

export default function JudgeScoringModal({ request, onClose, onComplete }: JudgeScoringModalProps) {
  const { user, profile } = useAuth();
  const { thumbnail } = useThumbnail(request.submission_url, request.platform);
  
  const [mode, setMode] = useState<ScoringMode>('full');
  const [scores, setScores] = useState({
    emotion: 8,
    creativity: 15,
    sync: 15,
    identity: 5,
    execution: 15,
  });
  const [vibesScore, setVibesScore] = useState(70);
  const [selectedTier, setSelectedTier] = useState<string>('B');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [completedReviewData, setCompletedReviewData] = useState<any>(null);

  const calculateTotal = () => {
    switch (mode) {
      case 'full':
        return scores.emotion + scores.creativity + scores.sync + scores.identity + scores.execution;
      case 'vibes':
        return vibesScore;
      case 'two_pillar':
        return Math.round(((scores.sync / 25) + (scores.execution / 20)) / 2 * 100);
      case 'tier_only':
        return TIER_SCORES[selectedTier];
      default:
        return 0;
    }
  };

  const handleSubmit = async () => {
    if (!user || !profile) return;

    setSaving(true);
    const totalScore = calculateTotal();

    try {
      // Update review request with rating mode and selected tier
      const { error } = await supabase
        .from('review_requests')
        .update({
          status: 'reviewed',
          total_score: totalScore,
          emotion_score: mode === 'full' ? scores.emotion : null,
          creativity_score: mode === 'full' ? scores.creativity : null,
          sync_score: mode === 'full' || mode === 'two_pillar' ? scores.sync : null,
          identity_score: mode === 'full' ? scores.identity : null,
          execution_score: mode === 'full' || mode === 'two_pillar' ? scores.execution : null,
          judge_comment: comment || null,
          judge_id: user.id,
          judge_username: profile.username,
          judge_avatar_url: profile.avatar_url || null,
          reviewed_at: new Date().toISOString(),
          rating_mode: mode,
          selected_tier: mode === 'tier_only' ? selectedTier : null,
        })
        .eq('id', request.id);

      if (error) throw error;

      // Award XP to both judge and editor
      await awardReviewXP(user.id, profile.username, request.user_id);

      // Create notification for editor
      await supabase.from('notifications').insert({
        user_id: request.user_id,
        type: 'review_complete',
        title: 'Review Complete!',
        message: `Your edit was reviewed by @${profile.username}. Score: ${totalScore}/100`,
        data: { review_id: request.id, score: totalScore, judge: profile.username },
      });

      // Add to activity feed
      await supabase.from('activity_feed').insert({
        user_id: request.user_id,
        username: request.username,
        avatar_url: request.avatar_url,
        activity_type: 'review_received',
        title: `@${request.username} received a judge review`,
        description: `@${profile.username} scored their edit ${totalScore}/100`,
        data: { score: totalScore, judge_username: profile.username, platform: request.platform },
      });

      toast.success(`Review submitted! Score: ${totalScore}/100`);

      // Store data for export modal - ensure all scores have defaults for card display
      const emotionFinal = mode === 'full' ? scores.emotion : Math.round(totalScore * 0.15);
      const creativityFinal = mode === 'full' ? scores.creativity : Math.round(totalScore * 0.25);
      const syncFinal = mode === 'full' || mode === 'two_pillar' ? scores.sync : Math.round(totalScore * 0.25);
      const identityFinal = mode === 'full' ? scores.identity : Math.round(totalScore * 0.10);
      const executionFinal = mode === 'full' || mode === 'two_pillar' ? scores.execution : Math.round(totalScore * 0.25);

      setCompletedReviewData({
        editorUsername: request.username,
        judgeUsername: profile.username,
        judgeAvatarUrl: profile.avatar_url,
        totalScore,
        emotionScore: emotionFinal,
        creativityScore: creativityFinal,
        syncScore: syncFinal,
        identityScore: identityFinal,
        executionScore: executionFinal,
        comment,
      });

      setShowExport(true);
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSaving(false);
    }
  };

  const handleExportClose = () => {
    setShowExport(false);
    onComplete();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-card border border-border rounded-t-2xl sm:rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              {/* Thumbnail */}
              <div className="w-12 h-16 bg-surface-1 rounded-lg overflow-hidden">
                {thumbnail && (
                  <img src={thumbnail} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div>
                <p className="font-display text-sm">@{request.username}</p>
                <a 
                  href={request.submission_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gold hover:underline flex items-center gap-1"
                >
                  <ExternalLink size={10} />
                  Watch Edit
                </a>
              </div>
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
            {/* Scoring Mode Selection */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">
                Rating Mode
              </label>
              <div className="grid grid-cols-4 gap-2">
                {SCORING_MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`p-2 rounded-lg text-center transition-all border ${
                      mode === m.id
                        ? 'bg-gold/10 border-gold text-gold'
                        : 'bg-surface-1 border-border hover:border-gold/50'
                    }`}
                  >
                    <div className="text-xs font-bold">{m.label}</div>
                    <div className="text-[10px] text-muted-foreground">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Full QOI Mode */}
            {mode === 'full' && (
              <div className="space-y-3">
                {PILLARS.map((pillar) => {
                  const Icon = pillar.icon;
                  const score = scores[pillar.id as keyof typeof scores];
                  return (
                    <div key={pillar.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon size={14} className={pillar.color} />
                          <span className="text-xs font-medium">{pillar.label}</span>
                        </div>
                        <span className="text-xs font-bold text-gold">{score}/{pillar.max}</span>
                      </div>
                      <Slider
                        value={[score]}
                        max={pillar.max}
                        step={1}
                        onValueChange={([v]) => setScores(prev => ({ ...prev, [pillar.id]: v }))}
                        className="py-1"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Vibes Mode */}
            {mode === 'vibes' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Vibes</span>
                  <span className="text-xl font-bold text-gold">{vibesScore}/100</span>
                </div>
                <Slider
                  value={[vibesScore]}
                  max={100}
                  step={1}
                  onValueChange={([v]) => setVibesScore(v)}
                  className="py-2"
                />
              </div>
            )}

            {/* Two Pillar Mode */}
            {mode === 'two_pillar' && (
              <div className="space-y-3">
                {PILLARS.filter(p => ['sync', 'execution'].includes(p.id)).map((pillar) => {
                  const Icon = pillar.icon;
                  const score = scores[pillar.id as keyof typeof scores];
                  return (
                    <div key={pillar.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon size={14} className={pillar.color} />
                          <span className="text-xs font-medium">{pillar.label}</span>
                        </div>
                        <span className="text-xs font-bold text-gold">{score}/{pillar.max}</span>
                      </div>
                      <Slider
                        value={[score]}
                        max={pillar.max}
                        step={1}
                        onValueChange={([v]) => setScores(prev => ({ ...prev, [pillar.id]: v }))}
                        className="py-1"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tier Only Mode */}
            {mode === 'tier_only' && (
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Select Class
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {TIERS.map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setSelectedTier(tier)}
                      className={`py-3 rounded-lg text-lg font-bold transition-all border ${
                        selectedTier === tier
                          ? tier === 'S' ? 'bg-gradient-to-b from-gold to-amber-600 text-black border-transparent' :
                            tier === 'A' ? 'bg-purple-500 text-white border-transparent' :
                            tier === 'F' ? 'bg-red-500 text-white border-transparent' :
                            'bg-gold/10 border-gold text-gold'
                          : 'bg-surface-1 border-border hover:border-gold/50'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Total Score Display */}
            <div className="bg-surface-1 border border-gold/30 rounded-xl p-4 text-center">
              {mode === 'tier_only' ? (
                <>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Final Grade</p>
                  <p className={`text-5xl font-display font-bold ${
                    selectedTier === 'S' ? 'text-gold' :
                    selectedTier === 'A' ? 'text-purple-400' :
                    selectedTier === 'B' ? 'text-blue-400' :
                    selectedTier === 'C' ? 'text-slate-300' :
                    selectedTier === 'D' ? 'text-orange-400' :
                    'text-red-500'
                  }`}>{selectedTier}</p>
                  <p className="text-xs text-muted-foreground mt-1">Class Rating</p>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Score</p>
                  <p className="text-4xl font-bold text-gold">{calculateTotal()}</p>
                  <p className="text-xs text-muted-foreground">/ 100</p>
                </>
              )}
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <MessageSquare size={10} />
                Judge Comment (Optional)
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts on this edit..."
                className="bg-surface-1 border-border resize-none h-24"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border shrink-0">
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full bg-gold text-black hover:bg-gold/90 font-bold"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {mode === 'tier_only' 
                    ? `Submit Review (${selectedTier} Class)` 
                    : `Submit Review (${calculateTotal()}/100)`
                  }
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>

      {/* Export Modal */}
      {showExport && completedReviewData && (
        <JudgeCardExport
          isOpen={showExport}
          onClose={handleExportClose}
          data={completedReviewData}
          onSubmitToEditor={async () => { handleExportClose(); }}
        />
      )}
    </>
  );
}
